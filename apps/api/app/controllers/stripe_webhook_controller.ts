import type { HttpContext } from '@adonisjs/core/http'
import type Stripe from 'stripe'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { stripe } from '#config/stripe'
import Order from '#models/order'
import Payment from '#models/payment'
import Seller from '#models/seller'
import { cancelOrdersForPayment } from '#services/payments'
import { syncPayoutStatus } from '#services/stripe_connect'

/**
 * Stripe's word on what actually happened, and the only place an order is
 * allowed to become `paid`. The browser reporting success proves nothing —
 * anyone can post to our API — whereas a signed webhook is Stripe itself.
 */
export default class StripeWebhookController {
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    /**
     * The signature covers the bytes Stripe sent, so the parsed body is no
     * use here — re-serialising it would reorder keys and change whitespace,
     * and every event would fail verification. Adonis keeps the original
     * around alongside the parsed copy.
     */
    const rawBody = request.raw()

    if (!signature || !rawBody) {
      return response.badRequest({
        errors: [{ code: 'STRIPE_SIGNATURE_MISSING', message: 'Missing Stripe signature.' }],
      })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.get('STRIPE_WEBHOOK_SECRET').release()
      )
    } catch (error) {
      // Either someone is forging events or the endpoint secret is stale —
      // the `stripe listen` CLI mints a new one every session.
      logger.warn({ err: error }, 'Rejected Stripe webhook with an invalid signature')
      return response.badRequest({
        errors: [{ code: 'STRIPE_SIGNATURE_INVALID', message: 'Invalid Stripe signature.' }],
      })
    }

    /**
     * Stripe delivers at least once, not exactly once. Claiming the event id
     * up front means a duplicate delivery collides on the primary key and
     * stops here, before it can pay a seller a second time.
     */
    const claimed = await db
      .table('stripe_events')
      .insert({ id: event.id, type: event.type, created_at: new Date(), updated_at: new Date() })
      .onConflict('id')
      .ignore()
      .returning('id')

    if (claimed.length === 0) {
      logger.info({ eventId: event.id, type: event.type }, 'Skipped duplicate Stripe event')
      return response.noContent()
    }

    try {
      await this.dispatch(event)
    } catch (error) {
      // Release the claim so Stripe's retry gets a real second attempt
      // instead of being waved through as a duplicate.
      await db.from('stripe_events').where('id', event.id).delete()
      logger.error({ err: error, eventId: event.id, type: event.type }, 'Stripe webhook failed')
      throw error
    }

    return response.noContent()
  }

  private async dispatch(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.onPaymentSucceeded(event.data.object)
      case 'payment_intent.processing':
      case 'payment_intent.payment_failed':
        return this.onPaymentUnsettled(event.data.object)
      case 'payment_intent.canceled':
        return this.onPaymentCanceled(event.data.object)
      case 'account.updated':
        return this.onAccountUpdated(event.data.object)
      default:
        logger.debug({ type: event.type }, 'Ignoring unhandled Stripe event')
    }
  }

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const payment = await this.paymentFor(intent)
    if (!payment) return

    if (payment.status !== 'succeeded') {
      payment.status = 'succeeded'
      payment.lastError = null
      await payment.save()
    }

    const orders = await Order.query().where('paymentId', payment.id).preload('seller')

    for (const order of orders) {
      if (order.status === 'expired' || order.status === 'cancelled') {
        /**
         * The reservation lapsed and the stock went back on the shelf, but
         * the buyer paid anyway — the cancel and the confirmation crossed in
         * flight. The money is real, so the order stands; taking the units
         * back can drive stock negative, which is the honest signal that the
         * seller now owes more than they have.
         */
        logger.error(
          { orderId: order.id, reference: order.reference, previousStatus: order.status },
          'Payment succeeded for an order whose reservation had already lapsed'
        )
        await this.reclaimStock(order)
      }

      if (order.status !== 'paid') {
        order.status = 'paid'
        order.expiresAt = null
        await order.save()
      }

      /**
       * No transfer here. The money stays on the platform balance until the
       * order completes — the buyer confirming receipt, or the hold lapsing
       * after dispatch. Paying the seller at this point is what made a later
       * refund depend on clawing money back out of their account, which is
       * the one step that can fail outright.
       */
    }
  }

  /**
   * A declined card leaves the intent back at `requires_payment_method`, so
   * the orders stay reserved and the buyer can try another card until the
   * payment window runs out.
   */
  private async onPaymentUnsettled(intent: Stripe.PaymentIntent) {
    const payment = await this.paymentFor(intent)
    if (!payment || payment.isTerminal) return

    payment.status = intent.status
    payment.lastError = intent.last_payment_error?.message ?? null
    await payment.save()
  }

  private async onPaymentCanceled(intent: Stripe.PaymentIntent) {
    const payment = await this.paymentFor(intent)
    if (!payment) return

    if (payment.status !== 'canceled') {
      payment.status = 'canceled'
      await payment.save()
    }

    await cancelOrdersForPayment(payment.id)
  }

  private async onAccountUpdated(account: Stripe.Account) {
    const seller = await Seller.query().where('stripeAccountId', account.id).first()
    if (!seller) return

    await syncPayoutStatus(seller, account)
  }

  private async paymentFor(intent: Stripe.PaymentIntent) {
    const payment = await Payment.query().where('stripePaymentIntentId', intent.id).first()

    if (!payment) {
      // Most likely another application sharing the same Stripe account, or a
      // test event fired by hand. Nothing to do, and not an error.
      logger.info({ intentId: intent.id }, 'No payment row for PaymentIntent')
    }

    return payment
  }

  private async reclaimStock(order: Order) {
    await db.rawQuery(
      `UPDATE product_variants v
          SET stock_quantity = v.stock_quantity - oi.quantity,
              updated_at = NOW()
         FROM order_items oi, products p
        WHERE oi.order_id = ?
          AND v.id = oi.product_variant_id
          AND p.id = v.product_id
          AND p.tracks_inventory`,
      [order.id]
    )
  }
}
