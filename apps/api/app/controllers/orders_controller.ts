import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import ProductVariant from '#models/product_variant'
import OrderTransformer from '#transformers/order_transformer'
import { createOrderValidator } from '#validators/order'

export default class OrdersController {
  /**
   * Turns a cart into orders — one per seller, since each is fulfilled and
   * paid separately.
   *
   * Everything the buyer agreed to is re-derived server-side. The client
   * sends only variant ids and quantities; prices, titles and availability
   * come from the database inside the transaction, so a tampered or simply
   * stale cart can't dictate what anything costs.
   */
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { items, shipping } = await request.validateUsing(createOrderValidator)

    // Collapse duplicate lines up front: the same variant twice would
    // otherwise pass the stock check separately and oversell.
    const quantities = new Map<string, number>()
    for (const item of items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity)
    }

    try {
      const orders = await db.transaction(async (trx) => {
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
            (sum, variant) =>
              sum + Number(variant.priceCents) * quantities.get(variant.id)!,
            0
          )

          const order = new Order()
          order.useTransaction(trx)
          order.reference = await Order.generateReference()
          order.userId = user.id
          order.sellerId = sellerId
          order.status = 'pending'
          order.currency = currency
          order.subtotalCents = subtotal
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

          await order.load((preloader) => preloader.load('items').load('seller'))
          created.push(order)
        }

        return created
      })

      response.status(201)
      return serialize(OrderTransformer.transform(orders))
    } catch (error) {
      if (error instanceof OrderError) {
        return response.conflict({ errors: [{ code: error.code, message: error.message }] })
      }
      throw error
    }
  }

  async show({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const order = await Order.query()
      .where('reference', params.reference)
      .where('userId', user.id)
      .preload('items')
      .preload('seller')
      .first()

    if (!order) {
      return response.notFound({
        errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
      })
    }

    return serialize(OrderTransformer.transform(order))
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
