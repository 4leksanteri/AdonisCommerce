import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Order from '#models/order'
import Seller from '#models/seller'
import Dispute from '#models/dispute'
import OrderTransformer from '#transformers/order_transformer'
import { cancelOrderValidator, shipOrderValidator } from '#validators/seller_order'
import { refundOrder } from '#services/payments'
import { schedulePayoutRelease, scheduleDeliveryNudge } from '#services/queue'
import {
  notifyOrderAccepted,
  notifyOrderCancelled,
  notifyOrderShipped,
} from '#services/order_notifications'

/**
 * Checkouts that never became sales. A `pending_payment` row is a browser tab
 * someone left open and `expired` is one they abandoned; listing either would
 * make every shop look busier than it is and bury the orders that need a
 * response.
 *
 * Deliberately a list of what to *hide* rather than what to show. The first
 * version of this named the statuses to include, and adding `disputed` and
 * `completed` to the state machine silently dropped them out of every seller's
 * order list — the one order a seller most needs to see was the one that
 * disappeared. Anything new is visible by default now.
 */
const HIDDEN_STATUSES = ['pending_payment', 'expired'] as const

/** Days on the sparkline. Two of these are queried; the older half is the
 *  baseline the delta is measured against. */
const SPARK_DAYS = 14

export default class OrdersController {
  async index({ auth, request, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const status = request.input('status') as string | undefined
    const page = Number(request.input('page', 1)) || 1

    const orders = await this.baseQuery(seller.id)
      .if(status !== undefined, (query) => query.where('status', status!))
      .if(status === undefined, (query) => query.whereNotIn('status', [...HIDDEN_STATUSES]))
      .orderBy('createdAt', 'desc')
      .paginate(page, 25)

    return serialize(OrderTransformer.paginate(orders.all(), orders.getMeta()).depth(2))
  }

  /**
   * What the panel's summary cards read from.
   *
   * A single sales figure is safe here in a way it never is platform-wide:
   * every order carries the *seller's* currency, so one shop's orders are all
   * in one currency and adding them up means something.
   */
  async stats({ auth, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const since = DateTime.now().minus({ days: SPARK_DAYS * 2 - 1 }).startOf('day')

    /**
     * One row per day, zero-filled. `generate_series` rather than filling the
     * gaps in JavaScript: a day with no orders still has to occupy its place
     * on the line, or the sparkline silently compresses quiet weeks and
     * reads as steadier than the shop actually is.
     */
    const daily = await db.rawQuery(
      `with days as (
         select generate_series(?::date, current_date, '1 day')::date as day
       )
       select days.day,
              count(o.id)::int as orders,
              coalesce(sum(o.subtotal_cents + o.shipping_cents), 0)::bigint as cents
         from days
         left join orders o
           on o.seller_id = ?
          and o.status not in (?, ?)
          and o.created_at >= days.day
          and o.created_at < days.day + 1
        group by days.day
        order by days.day`,
      [since.toSQLDate(), seller.id, ...HIDDEN_STATUSES]
    )

    const rows: { orders: number; cents: number }[] = daily.rows.map(
      (row: { orders: number; cents: string }) => ({
        orders: Number(row.orders),
        cents: Number(row.cents),
      })
    )

    // The window is twice as long as the line so the delta has a like-for-like
    // period behind it to compare against.
    const previous = rows.slice(0, SPARK_DAYS)
    const current = rows.slice(SPARK_DAYS)
    const sum = (list: typeof rows, key: 'orders' | 'cents') =>
      list.reduce((total, row) => total + row[key], 0)

    /**
     * Counts for the status tabs. Every visible status a shop actually has,
     * rather than a fixed list — a shop with no disputes should not be shown
     * an empty "Problems" tab inviting it to look for trouble.
     */
    const byStatus = await db
      .from('orders')
      .where('seller_id', seller.id)
      .whereNotIn('status', [...HIDDEN_STATUSES])
      .groupBy('status')
      .select('status')
      .count('* as total')

    const openProblems = await Dispute.query()
      .where('status', 'open')
      .whereHas('order', (orders) => orders.where('sellerId', seller.id))
      .count('* as total')
      .first()

    return serialize({
      currency: seller.currency,
      days: SPARK_DAYS,
      orders: {
        total: sum(current, 'orders'),
        previous: sum(previous, 'orders'),
        series: current.map((row) => row.orders),
      },
      sales: {
        total: sum(current, 'cents'),
        previous: sum(previous, 'cents'),
        series: current.map((row) => row.cents),
      },
      openProblems: Number(openProblems?.$extras.total ?? 0),
      statusCounts: Object.fromEntries(
        byStatus.map((row: { status: string; total: string }) => [row.status, Number(row.total)])
      ),
    })
  }

  async show({ auth, params, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const order = await this.baseQuery(seller.id).where('id', params.id).first()
    if (!order) return this.notFound(response)

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  /**
   * The seller taking the job on. For made-to-order work this is a real
   * decision rather than a formality, which is why the buyer sees "awaiting
   * confirmation" until it happens.
   */
  async accept({ auth, params, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const order = await this.baseQuery(seller.id).where('id', params.id).first()
    if (!order) return this.notFound(response)

    if (!order.canAccept) {
      return this.wrongState(response, 'ORDER_NOT_ACCEPTABLE', 'This order cannot be accepted.')
    }

    order.status = 'accepted'
    order.acceptedAt = DateTime.now()
    await order.save()

    await notifyOrderAccepted(order)

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  async ship({ auth, params, request, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const { trackingNumber } = await request.validateUsing(shipOrderValidator)

    const order = await this.baseQuery(seller.id).where('id', params.id).first()
    if (!order) return this.notFound(response)

    if (!order.canShip) {
      return this.wrongState(response, 'ORDER_NOT_SHIPPABLE', 'This order cannot be shipped.')
    }

    const shippedAt = DateTime.now()

    order.status = 'shipped'
    order.shippedAt = shippedAt
    order.trackingNumber = trackingNumber ?? null
    /**
     * The payout clock starts at dispatch, not at payment — otherwise a maker
     * who spends ten days on a commission would be paid before it was even in
     * the post. The buyer confirming receipt releases it sooner.
     */
    order.payoutReleaseAt = shippedAt.plus({ days: order.holdWindowDays(seller.country) })
    await order.save()

    await schedulePayoutRelease(order)
    await scheduleDeliveryNudge(order, order.nudgeAfterDays(seller.country))
    await notifyOrderShipped(order)

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  /**
   * Cancels and refunds in one step. There is no way to cancel *without*
   * refunding: the seller is calling off something the buyer has already paid
   * for, and any other outcome is just keeping their money.
   *
   * On a disputed order this doubles as the seller settling it themselves,
   * which is the common case — a parcel lost in the post that they would
   * rather refund than argue about. It closes the dispute as
   * `resolved_refunded` with the seller recorded as the resolver, so the
   * history reads the same whether they settled it or we did.
   */
  async cancel({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const { reason } = await request.validateUsing(cancelOrderValidator)

    const order = await this.baseQuery(seller.id).where('id', params.id).first()
    if (!order) return this.notFound(response)

    if (!order.canCancel) {
      return this.wrongState(
        response,
        'ORDER_NOT_CANCELLABLE',
        'This order can no longer be cancelled.'
      )
    }

    // Post-dispatch goods don't come back to the shelf, so a dispute refund
    // must not credit the stock the way a pre-dispatch cancellation does.
    const settlingDispute = order.isDisputed
    await refundOrder(order, reason ?? null, !settlingDispute)

    if (settlingDispute) {
      await Dispute.query()
        .where('orderId', order.id)
        .where('status', 'open')
        .update({
          status: 'resolved_refunded',
          resolvedByUserId: user.id,
          resolutionNote: reason ?? null,
          resolvedAt: DateTime.now().toSQL(),
          updatedAt: DateTime.now().toSQL(),
        })
    }

    await order.load((preloader) => preloader.load('items').load('seller').load('disputes'))
    await notifyOrderCancelled(order)

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  /**
   * Scoped to the seller on every route, so another shop's order id is a 404
   * here rather than a leak. Items carry their own snapshots, so nothing else
   * needs preloading to render an order.
   */
  private baseQuery(sellerId: string) {
    return Order.query()
      .where('sellerId', sellerId)
      .preload('items')
      .preload('seller')
      .preload('disputes', (query) => query.orderBy('createdAt', 'desc'))
  }

  private sellerFor(auth: HttpContext['auth']) {
    return Seller.query().where('userId', auth.getUserOrFail().id).first()
  }

  private notASeller(response: HttpContext['response']) {
    return response.forbidden({
      errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account to manage orders.' }],
    })
  }

  private notFound(response: HttpContext['response']) {
    return response.notFound({
      errors: [{ code: 'ORDER_NOT_FOUND', message: 'Order not found.' }],
    })
  }

  private wrongState(response: HttpContext['response'], code: string, message: string) {
    return response.conflict({ errors: [{ code, message }] })
  }
}
