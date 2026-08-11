import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderItemTransformer from '#transformers/order_item_transformer'
import { orderTotalCents } from '#services/payments'

/**
 * The order as a dispute needs it: enough to judge the case without leaving
 * the page, including both sides' contact details.
 *
 * Its own transformer rather than a plain object inside the dispute's, because
 * the serializer only resolves transformer results that are *direct* values of
 * what `toObject` returns — one buried inside a nested plain object comes out
 * as an unresolved marker and blows up in the browser.
 */
export default class DisputeOrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'reference',
        'sellerOrderNumber',
        'status',
        'currency',
        'shopName',
        'shippedAt',
        'trackingNumber',
      ]),
      totalCents: orderTotalCents(this.resource),
      refundedCents: Number(this.resource.refundedCents),
      // False means the money is still on the platform balance — the ordinary
      // case, and what makes refunding a step rather than a clawback.
      isPaidOut: this.resource.isPaidOut,
      buyerName: this.resource.shippingName,
      buyerEmail: this.resource.contactEmail,
      items: OrderItemTransformer.transform(this.resource.items),
    }
  }
}
