import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Order, { PAYMENT_WINDOW_MINUTES } from '#models/order'
import OrderItem from '#models/order_item'
import Payment from '#models/payment'
import ProductVariant from '#models/product_variant'
import PublicOrderTransformer from '#transformers/public_order_transformer'
import PaymentTransformer from '#transformers/payment_transformer'
import { createOrderValidator } from '#validators/order'
import { shippingCentsFor } from '#services/shipping'
import { platformFeeCents } from '#config/stripe'
import Dispute from '#models/dispute'
import { openDisputeValidator } from '#validators/dispute'
import { schedulePayoutRelease } from '#services/queue'
import { notifyProblemReported } from '#services/order_notifications'
import {
  cancelUnpaidOrdersForUser,
  completeOrder,
  createPaymentIntent,
  orderTotalCents,
  releaseExpiredReservations,
} from '#services/payments'

export default class StorefrontOrdersController {
  /**
   * Turns a cart into orders — one per seller, since each is fulfilled and
   * paid separately — plus the payment(s) that will settle them.
   *
   * Everything the buyer agreed to is re-derived server-side. The client
   * sends only variant ids and quantities; prices, titles and availability
   * come from the database inside the transaction, so a tampered or simply
   * stale cart can't dictate what anything costs.
   */
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { items, shipping } = await request.validateUsing(createOrderValidator)

    // Before taking any locks: hand back stock held by checkouts that were
    // started and never paid for — everyone's expired ones, and this buyer's
    // own unfinished attempt, which would otherwise be holding the very items
    // they are trying to buy again. Done outside the transaction below so the
    // two can never wait on each other.
    await releaseExpiredReservations()
    await cancelUnpaidOrdersForUser(user.id)

    // Collapse duplicate lines up front: the same variant twice would
    // otherwise pass the stock check separately and oversell.
    const quantities = new Map<string, number>()
    for (const item of items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity)
    }

    try {
      const { orders, payments } = await db.transaction(async (trx) => {
        /**
         * `forUpdate` locks the variant rows for the life of the transaction.
         * Without it two shoppers can both read "1 left" and both succeed —
         * the check and the decrement have to be one atomic step.
         */
        const variants = await ProductVariant.query({ client: trx })
          .whereIn('id', [...quantities.keys()])
          .whereHas('product', (product) =>
            product
              .where('status', 'active')
              .whereHas('seller', (seller) => seller.where('status', 'approved'))
          )
          .preload('optionValues', (query) => query.preload('option'))
          .preload('product', (product) => {
            product.preload('seller')
            product.preload('images', (images) => images.orderBy('position').limit(1))
            product.preload('shippingProfile', (profile) => profile.preload('rates'))
          })
          .forUpdate()

        if (variants.length !== quantities.size) {
          throw new OrderError('ORDER_ITEM_UNAVAILABLE', 'An item is no longer available.')
        }

        for (const variant of variants) {
          const wanted = quantities.get(variant.id)!
          if (variant.product.tracksInventory && variant.stockQuantity < wanted) {
            throw new OrderError(
              'ORDER_INSUFFICIENT_STOCK',
              `Only ${variant.stockQuantity} left of ${variant.product.title}.`
            )
          }

          /**
           * Checked before taking any money. Without a connected payout
           * account there is nowhere to send the seller's share, so the
           * platform would be holding funds it has no way to pass on.
           */
          if (variant.product.seller.payoutStatus !== 'connected') {
            throw new OrderError(
              'ORDER_SELLER_NOT_PAYABLE',
              `${variant.product.seller.shopName} is not accepting payments yet.`
            )
          }
        }

        // Group by seller — one order each.
        const bySeller = new Map<string, ProductVariant[]>()
        for (const variant of variants) {
          const sellerId = variant.product.sellerId
          bySeller.set(sellerId, [...(bySeller.get(sellerId) ?? []), variant])
        }

        const created: Order[] = []

        for (const [sellerId, sellerVariants] of bySeller) {
          const currency = sellerVariants[0].product.currency
          const subtotal = sellerVariants.reduce(
            (sum, variant) => sum + Number(variant.priceCents) * quantities.get(variant.id)!,
            0
          )

          /**
           * Priced here rather than trusted from the client, same as the
           * items. Grouping by profile means three soaps travel as one
           * parcel; a separate "large parcel" profile is a second box and
           * costs again.
           */
          const { cents: shippingCents, undeliverable } = shippingCentsFor(
            sellerVariants.map((variant) => ({
              profile: variant.product.shippingProfile ?? null,
              quantity: quantities.get(variant.id)!,
            })),
            shipping.country
          )

          if (undeliverable.length > 0) {
            throw new OrderError(
              'ORDER_UNDELIVERABLE',
              `${sellerVariants[0].product.seller.shopName} does not ship to ${shipping.country.toUpperCase()}.`
            )
          }

          /**
           * Bumped in a single statement so two concurrent orders for the same
           * shop can't both read the same value. `RETURNING` sees the updated
           * row, so subtracting one gives the number this order just claimed.
           */
          const allocated = await trx.rawQuery(
            'UPDATE sellers SET next_order_number = next_order_number + 1 WHERE id = ? RETURNING next_order_number - 1 AS assigned',
            [sellerId]
          )

          const order = new Order()
          order.useTransaction(trx)
          order.reference = await Order.generateReference(trx)
          order.sellerOrderNumber = Number(allocated.rows[0].assigned)
          order.userId = user.id
          order.sellerId = sellerId
          order.status = 'pending_payment'
          order.currency = currency
          order.subtotalCents = subtotal
          order.shippingCents = shippingCents
          // Frozen at purchase time so a later change to the commission rate
          // can't rewrite what a seller was owed for a past order.
          order.platformFeeCents = platformFeeCents(subtotal + shippingCents)
          order.expiresAt = DateTime.now().plus({ minutes: PAYMENT_WINDOW_MINUTES })
          order.contactEmail = user.email
          order.shippingName = shipping.name
          order.shippingLine1 = shipping.line1
          order.shippingLine2 = shipping.line2 ?? null
          order.shippingCity = shipping.city
          order.shippingPostalCode = shipping.postalCode
          order.shippingCountry = shipping.country.toUpperCase()
          await order.save()

          for (const variant of sellerVariants) {
            const quantity = quantities.get(variant.id)!

            const item = new OrderItem()
            item.useTransaction(trx)
            item.orderId = order.id
            item.productVariantId = variant.id
            // Snapshots — see the order_items migration for why.
            item.productTitle = variant.product.title
            item.productSlug = variant.product.slug
            item.variantLabel = [...variant.optionValues]
              .sort((a, b) => a.option.position - b.option.position)
              .map((optionValue) => optionValue.value)
              .join(' / ')
            item.imagePath = variant.product.images.at(0)?.path ?? null
            item.unitPriceCents = Number(variant.priceCents)
            item.currency = currency
            item.quantity = quantity
            await item.save()

            if (variant.product.tracksInventory) {
              variant.useTransaction(trx)
              variant.stockQuantity -= quantity
              await variant.save()
            }
          }

          created.push(order)
        }

        /**
         * One payment per currency. A PaymentIntent carries a single
         * currency, so a basket holding a Finnish shop's euros and a Swedish
         * shop's kronor is honestly two charges rather than an exchange rate
         * neither seller agreed to.
         */
        const byCurrency = new Map<string, Order[]>()
        for (const order of created) {
          byCurrency.set(order.currency, [...(byCurrency.get(order.currency) ?? []), order])
        }

        const paymentRows: Payment[] = []

        for (const [currency, currencyOrders] of byCurrency) {
          const payment = new Payment()
          payment.useTransaction(trx)
          payment.userId = user.id
          payment.currency = currency
          payment.amountCents = currencyOrders.reduce(
            (sum, order) => sum + orderTotalCents(order),
            0
          )
          payment.status = 'requires_payment_method'
          await payment.save()

          for (const order of currencyOrders) {
            order.useTransaction(trx)
            order.paymentId = payment.id
            await order.save()
          }

          paymentRows.push(payment)
        }

        return { orders: created, payments: paymentRows }
      })

      /**
       * Stripe is called only once the orders are safely committed. If this
       * throws, the buyer sees an error and the reservation lapses on its own
       * within the payment window — the alternative, holding row locks across
       * a network call, would stall every other shopper wanting these items.
       */
      for (const payment of payments) {
        await createPaymentIntent(
          payment,
          user,
          orders.filter((order) => order.paymentId === payment.id)
        )
      }

      // Loaded after commit: this is presentation, and holding the row locks
      // open for it would lengthen every checkout for no benefit.
      for (const order of orders) {
        await order.load((preloader) => preloader.load('items').load('seller'))
      }

      response.status(201)
      return serialize({
        orders: PublicOrderTransformer.transform(orders),
        payments: PaymentTransformer.transform(payments),
      })
    } catch (error) {
      if (error instanceof OrderError) {
        return response.conflict({ errors: [{ code: error.code, message: error.message }] })
      }
      throw error
    }
  }

  /**
   * The buyer's own order history. Unpaid and expired checkouts are left out
   * — an abandoned basket is not something anyone wants to see listed back at
   * them as an order.
   */
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = Number(request.input('page', 1)) || 1

    const orders = await Order.query()
      .where('userId', user.id)
      .whereNotIn('status', ['pending_payment', 'expired'])
      .preload('items', (items) => items.preload('review', (review) => review.preload('user')))
      .preload('seller')
      .preload('disputes', (query) => query.orderBy('createdAt', 'desc'))
      .orderBy('createdAt', 'desc')
      .paginate(page, 20)

    return serialize(PublicOrderTransformer.paginate(orders.all(), orders.getMeta()))
  }

  async show({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await Order.query()
      .where('reference', params.reference)
      .where('userId', user.id)
      .preload('items', (items) => items.preload('review', (review) => review.preload('user')))
      .preload('seller')
      .preload('disputes', (query) => query.orderBy('createdAt', 'desc'))
      .first()

    if (!order) {
      return response.notFound({
        errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
      })
    }

    return serialize(PublicOrderTransformer.transform(order))
  }

  /**
   * The buyer saying it arrived. Closes the order and releases the seller's
   * money straight away rather than making them wait out the hold — someone
   * holding the parcel has no reason to keep the maker waiting.
   */
  async confirmReceipt({ auth, params, response, serialize }: HttpContext) {
    const order = await this.ownedOrder(auth, params.reference)
    if (!order) {
      return response.notFound({
        errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
      })
    }

    if (!order.canConfirmReceipt) {
      return response.conflict({
        errors: [{ code: 'ORDER_NOT_CONFIRMABLE', message: 'This order cannot be confirmed yet.' }],
      })
    }

    await completeOrder(order)

    return serialize(PublicOrderTransformer.transform(order))
  }

  /**
   * Something went wrong. Opening a problem holds the seller's payout until
   * it is settled, which is the entire reason the money is still on the
   * platform balance at this point.
   */
  async openDispute({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { reason, detail } = await request.validateUsing(openDisputeValidator)

    const order = await this.ownedOrder(auth, params.reference)
    if (!order) {
      return response.notFound({
        errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
      })
    }

    if (!order.canDispute) {
      return response.conflict({
        errors: [{ code: 'ORDER_NOT_DISPUTABLE', message: 'This order cannot be disputed.' }],
      })
    }

    /**
     * The partial unique index on `disputes` allows only one open case per
     * order, so a double submit collides there rather than opening a second.
     */
    const existing = await Dispute.query()
      .where('orderId', order.id)
      .where('status', 'open')
      .first()

    if (existing) {
      return response.conflict({
        errors: [
          { code: 'DISPUTE_ALREADY_OPEN', message: 'A problem is already open for this order.' },
        ],
      })
    }

    await db.transaction(async (trx) => {
      const dispute = new Dispute()
      dispute.useTransaction(trx)
      dispute.orderId = order.id
      dispute.openedByUserId = user.id
      dispute.reason = reason
      dispute.detail = detail ?? null
      dispute.status = 'open'
      await dispute.save()

      order.useTransaction(trx)
      order.status = 'disputed'
      await order.save()
    })

    // The relation was preloaded before the dispute existed, so without this
    // the response would report the order as disputed with no dispute on it.
    await order.load('disputes')

    // The seller's payout is now on hold, so they need to hear about this
    // rather than discover it when the money doesn't arrive.
    await notifyProblemReported(order, detail ?? '')

    return serialize(PublicOrderTransformer.transform(order))
  }

  /**
   * The parcel turned up. Closes the problem and puts the order back where it
   * was, which lets the payout resume on its normal clock — a late delivery
   * shouldn't need anyone to arbitrate it.
   */
  async withdrawDispute({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await this.ownedOrder(auth, params.reference)
    if (!order) {
      return response.notFound({
        errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
      })
    }

    const open = await Dispute.query().where('orderId', order.id).where('status', 'open').first()

    if (!open) {
      return response.conflict({
        errors: [{ code: 'DISPUTE_NOT_OPEN', message: 'There is no open problem to withdraw.' }],
      })
    }

    await db.transaction(async (trx) => {
      open.useTransaction(trx)
      open.status = 'withdrawn'
      open.resolvedByUserId = user.id
      open.resolvedAt = DateTime.now()
      await open.save()

      order.useTransaction(trx)
      order.status = 'shipped'
      await order.save()
    })

    /**
     * Re-booked because the original job may have already run and been turned
     * away by the hold. If the release date has passed in the meantime the
     * delay is zero and it pays out on the next tick, which is right — the
     * parcel arrived and the wait is over.
     */
    await schedulePayoutRelease(order)
    await order.load('disputes')

    return serialize(PublicOrderTransformer.transform(order))
  }

  private async ownedOrder(auth: HttpContext['auth'], reference: string) {
    return Order.query()
      .where('reference', reference)
      .where('userId', auth.getUserOrFail().id)
      .preload('items', (items) => items.preload('review', (review) => review.preload('user')))
      .preload('seller')
      .preload('disputes', (query) => query.orderBy('createdAt', 'desc'))
      .first()
  }
}

/** Carries a translatable code out of the transaction to the HTTP layer. */
class OrderError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
  }
}
