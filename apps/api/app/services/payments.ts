import type Stripe from 'stripe'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { stripe } from '#config/stripe'
import type Order from '#models/order'
import type Payment from '#models/payment'
import type User from '#models/user'

/** Items plus postage — what the buyer is actually charged for this order. */
export function orderTotalCents(order: Order): number {
  return Number(order.subtotalCents) + Number(order.shippingCents)
}

/** What the seller receives: the order total less the platform's commission. */
export function sellerShareCents(order: Order): number {
  return orderTotalCents(order) - Number(order.platformFeeCents)
}

/**
 * Creates the PaymentIntent for a payment row and hands back the client
 * secret the browser needs.
 *
 * Deliberately called *after* the order transaction commits. A Stripe round
 * trip inside the transaction would hold the variant row locks open for the
 * length of an HTTP request, and every other shopper wanting those items
 * would queue behind it.
 *
 * `transfer_group` is the payment id, which is what later ties each seller's
 * Transfer back to this charge in the Stripe dashboard.
 */
export async function createPaymentIntent(
  payment: Payment,
  user: User,
  orders: Order[]
): Promise<Payment> {
  const intent = await stripe.paymentIntents.create(
    {
      amount: Number(payment.amountCents),
      currency: payment.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      transfer_group: payment.id,
      receipt_email: user.email,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        orderReferences: orders.map((order) => order.reference).join(','),
      },
    },
    // Retrying a failed request must not charge the buyer twice.
    { idempotencyKey: `payment-intent-${payment.id}` }
  )

  payment.stripePaymentIntentId = intent.id
  payment.status = intent.status
  await payment.save()

  payment.clientSecret = intent.client_secret

  return payment
}

/**
 * Moves one seller's share out of the platform balance and into their
 * connected account.
 *
 * `source_transaction` points the transfer at the specific charge that funded
 * it. Without it Stripe pays from the platform's *available* balance, which
 * in test mode is usually zero and in production lags the charge by days —
 * so the transfer would simply fail.
 *
 * Storing `stripe_transfer_id` is what makes a repeated webhook harmless:
 * paying a seller twice is not something a refund can tidy up.
 */
export async function transferToSeller(order: Order, chargeId: string): Promise<void> {
  if (order.stripeTransferId) return

  const seller = order.seller
  if (!seller.stripeAccountId) {
    // Checkout blocks orders from unconnected sellers, so reaching here means
    // the account was removed between order and payment. The money stays on
    // the platform balance until someone looks at it.
    logger.error(
      { orderId: order.id, reference: order.reference, sellerId: seller.id },
      'Cannot transfer: seller has no Stripe account'
    )
    return
  }

  const amount = sellerShareCents(order)
  if (amount <= 0) return

  const transfer = await stripe.transfers.create(
    {
      amount,
      currency: order.currency.toLowerCase(),
      destination: seller.stripeAccountId,
      source_transaction: chargeId,
      transfer_group: order.paymentId ?? undefined,
      metadata: { orderId: order.id, orderReference: order.reference, sellerId: seller.id },
    },
    { idempotencyKey: `transfer-${order.id}` }
  )

  order.stripeTransferId = transfer.id
  await order.save()
}

/** Pulls the charge id off a PaymentIntent, whether expanded or a bare ref. */
export function chargeIdFrom(intent: Stripe.PaymentIntent): string | null {
  const charge = intent.latest_charge
  if (!charge) return null
  return typeof charge === 'string' ? charge : charge.id
}

/**
 * Gives back the stock held by checkouts that were never paid for.
 *
 * Stock is decremented when the order is written, before the card is charged
 * — the right trade for one-of-a-kind goods, where letting two people pay for
 * the same item means refunding one of them. The price is that an abandoned
 * checkout would sit on the reservation forever, so this releases anything
 * past its deadline.
 *
 * Runs as its own short transaction before checkout takes any row locks, so
 * it can never deadlock against the order it is clearing the way for. The
 * `UPDATE ... RETURNING` is the guard: two concurrent sweeps race for the same
 * rows and only one wins them, so no order is ever released twice.
 *
 * Payments that already succeeded or are mid-authorisation are excluded — the
 * buyer's money is committed, and taking the goods back from underneath them
 * would be the worse failure.
 */
export async function releaseExpiredReservations(): Promise<void> {
  const orderIds = await db.transaction(async (trx) => {
    const expired = await trx.rawQuery(
      `UPDATE orders
          SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending_payment'
          AND expires_at < NOW()
          AND (
                payment_id IS NULL
                OR EXISTS (
                     SELECT 1 FROM payments p
                      WHERE p.id = orders.payment_id
                        AND p.status NOT IN ('succeeded', 'processing')
                   )
              )
      RETURNING id, payment_id`
    )

    const rows: { id: string; payment_id: string | null }[] = expired.rows
    if (rows.length === 0) return []

    await restoreStock(
      trx,
      rows.map((row) => row.id)
    )
    logger.info({ orderIds: rows.map((row) => row.id) }, 'Released expired payment reservations')

    return rows
  })

  if (orderIds.length === 0) return

  // Cancel the intents outside the transaction. Without this the buyer could
  // still confirm a payment for goods we have just put back on the shelf.
  const paymentIds = [...new Set(orderIds.map((row) => row.payment_id).filter(Boolean))]
  for (const paymentId of paymentIds) {
    await cancelIntentForPayment(paymentId as string)
  }
}

/**
 * Cancels the orders a payment was going to settle, after Stripe reports the
 * payment itself cancelled. Same stock release as an expiry, different cause,
 * so the buyer sees "cancelled" rather than "expired".
 */
export async function cancelOrdersForPayment(paymentId: string): Promise<string[]> {
  return db.transaction(async (trx) => {
    const cancelled = await trx.rawQuery(
      `UPDATE orders
          SET status = 'cancelled', expires_at = NULL, updated_at = NOW()
        WHERE payment_id = ? AND status = 'pending_payment'
      RETURNING id`,
      [paymentId]
    )

    const orderIds: string[] = cancelled.rows.map((row: { id: string }) => row.id)
    if (orderIds.length > 0) await restoreStock(trx, orderIds)

    return orderIds
  })
}

/**
 * Clears out a buyer's own abandoned checkout before they start another one.
 *
 * Without this, someone whose card was declined and who then went back to try
 * again would be blocked by their *own* reservation — the last item in stock
 * is held by the order they just walked away from, and checkout would tell
 * them it is sold out. Anything already paid or mid-authorisation is left
 * alone; only the unfinished attempt is torn down.
 */
export async function cancelUnpaidOrdersForUser(userId: string): Promise<void> {
  const rows = await db.transaction(async (trx) => {
    const cancelled = await trx.rawQuery(
      `UPDATE orders
          SET status = 'cancelled', expires_at = NULL, updated_at = NOW()
        WHERE user_id = ?
          AND status = 'pending_payment'
          AND (
                payment_id IS NULL
                OR EXISTS (
                     SELECT 1 FROM payments p
                      WHERE p.id = orders.payment_id
                        AND p.status NOT IN ('succeeded', 'processing')
                   )
              )
      RETURNING id, payment_id`,
      [userId]
    )

    const result: { id: string; payment_id: string | null }[] = cancelled.rows
    if (result.length > 0) {
      await restoreStock(
        trx,
        result.map((row) => row.id)
      )
    }

    return result
  })

  for (const paymentId of new Set(rows.map((row) => row.payment_id).filter(Boolean))) {
    await cancelIntentForPayment(paymentId as string)
  }
}

/**
 * Puts an order's units back on the shelf.
 *
 * Only tracked products gave stock up in the first place; made-to-order
 * listings never decremented and must not be credited back.
 */
async function restoreStock(trx: TransactionClientContract, orderIds: string[]): Promise<void> {
  const released = await trx
    .from('order_items')
    .join('product_variants', 'product_variants.id', 'order_items.product_variant_id')
    .join('products', 'products.id', 'product_variants.product_id')
    .whereIn('order_items.order_id', orderIds)
    .where('products.tracks_inventory', true)
    .groupBy('order_items.product_variant_id')
    .select('order_items.product_variant_id as variantId')
    .sum('order_items.quantity as quantity')

  for (const row of released) {
    await trx
      .from('product_variants')
      .where('id', row.variantId)
      .update({
        stock_quantity: trx.raw('stock_quantity + ?', [Number(row.quantity)]),
        updated_at: new Date(),
      })
  }
}

/**
 * Best-effort: an intent that has already succeeded can't be cancelled, and
 * that race is handled where the webhook lands, not here.
 */
async function cancelIntentForPayment(paymentId: string): Promise<void> {
  const row = await db
    .from('payments')
    .where('id', paymentId)
    .select('stripe_payment_intent_id')
    .first()

  const intentId: string | null = row?.stripe_payment_intent_id ?? null
  if (!intentId) return

  try {
    await stripe.paymentIntents.cancel(intentId, { cancellation_reason: 'abandoned' })
    await db.from('payments').where('id', paymentId).update({
      status: 'canceled',
      updated_at: new Date(),
    })
  } catch (error) {
    logger.warn({ paymentId, intentId, err: error }, 'Could not cancel expired PaymentIntent')
  }
}
