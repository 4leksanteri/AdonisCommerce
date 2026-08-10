import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Order from '#models/order'
import Seller from '#models/seller'
import OrderTransformer from '#transformers/order_transformer'
import { cancelOrderValidator, shipOrderValidator } from '#validators/seller_order'
import { refundOrder } from '#services/payments'

/**
 * Orders the seller has to do something about, newest first.
 *
 * Unpaid orders are deliberately absent unless asked for. A `pending_payment`
 * row is a checkout someone opened and may never finish; listing them as
 * sales would make every shop look busier than it is and bury the orders that
 * actually need a response.
 */
const DEFAULT_STATUSES = ['paid', 'accepted', 'shipped', 'cancelled'] as const

export default class OrdersController {
  async index({ auth, request, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const status = request.input('status') as string | undefined
    const page = Number(request.input('page', 1)) || 1

    const orders = await this.baseQuery(seller.id)
      .if(status !== undefined, (query) => query.where('status', status!))
      .if(status === undefined, (query) => query.whereIn('status', [...DEFAULT_STATUSES]))
      .orderBy('createdAt', 'desc')
      .paginate(page, 25)

    return serialize(OrderTransformer.paginate(orders.all(), orders.getMeta()).depth(2))
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

    order.status = 'shipped'
    order.shippedAt = DateTime.now()
    order.trackingNumber = trackingNumber ?? null
    await order.save()

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  /**
   * Cancels and refunds in one step. There is no way to cancel *without*
   * refunding: the seller is calling off something the buyer has already paid
   * for, and any other outcome is just keeping their money.
   */
  async cancel({ auth, params, request, response, serialize }: HttpContext) {
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

    await refundOrder(order, reason ?? null)
    await order.load((preloader) => preloader.load('items').load('seller'))

    return serialize(OrderTransformer.transform(order).depth(2))
  }

  /**
   * Scoped to the seller on every route, so another shop's order id is a 404
   * here rather than a leak. Items carry their own snapshots, so nothing else
   * needs preloading to render an order.
   */
  private baseQuery(sellerId: string) {
    return Order.query().where('sellerId', sellerId).preload('items').preload('seller')
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
