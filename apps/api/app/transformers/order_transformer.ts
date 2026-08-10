import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderItemTransformer from '#transformers/order_item_transformer'
import DisputeTransformer from '#transformers/dispute_transformer'
import { orderTotalCents, sellerShareCents } from '#services/payments'

/**
 * The seller's view of an order: everything the buyer sees, plus who they are,
 * what the shop actually earns on it, and which actions are available.
 *
 * The available actions come from the model rather than being re-derived in
 * the browser. There is one state machine and it lives on the server; a
 * second copy in the UI would drift and start offering buttons the API
 * rejects.
 */
export default class OrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'reference',
        'sellerOrderNumber',
        'status',
        'currency',
        'trackingNumber',
        'cancelReason',
        'createdAt',
        'acceptedAt',
        'shippedAt',
        'cancelledAt',
        'completedAt',
        'payoutReleaseAt',
      ]),
      // The seller's money is held until the order completes, so "have I been
      // paid, and if not when" is a question this page has to answer.
      isPaidOut: this.resource.isPaidOut,
      disputes: DisputeTransformer.transform(this.whenLoaded(this.resource.disputes)),
      subtotalCents: Number(this.resource.subtotalCents),
      shippingCents: Number(this.resource.shippingCents),
      totalCents: orderTotalCents(this.resource),
      // What the platform took and what is left for the shop. Shown because a
      // seller reconciling a payout should not have to work it out.
      platformFeeCents: Number(this.resource.platformFeeCents),
      payoutCents: sellerShareCents(this.resource),
      refundedCents: Number(this.resource.refundedCents),
      isRefunded: this.resource.isRefunded,
      // Null on a refunded order means the money went back to the buyer but
      // could not be clawed back from the shop — worth surfacing.
      transferReversed: this.resource.stripeTransferReversalId !== null,
      buyer: {
        name: this.resource.shippingName,
        email: this.resource.contactEmail,
      },
      shipping: {
        name: this.resource.shippingName,
        line1: this.resource.shippingLine1,
        line2: this.resource.shippingLine2,
        city: this.resource.shippingCity,
        postalCode: this.resource.shippingPostalCode,
        country: this.resource.shippingCountry,
      },
      actions: {
        canAccept: this.resource.canAccept,
        canShip: this.resource.canShip,
        canCancel: this.resource.canCancel,
      },
      items: OrderItemTransformer.transform(this.resource.items),
    }
  }
}
