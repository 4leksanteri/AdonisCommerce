import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderItemTransformer from '#transformers/order_item_transformer'
import DisputeTransformer from '#transformers/dispute_transformer'

export default class PublicOrderTransformer extends BaseTransformer<Order> {
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
        // When the order closes on its own if the buyer never confirms —
        // shown so the deadline isn't a surprise.
        'payoutReleaseAt',
      ]),
      actions: {
        canConfirmReceipt: this.resource.canConfirmReceipt,
        canReportProblem: this.resource.canDispute,
        // The parcel turned up after all — closing the problem themselves
        // beats waiting for anyone to arbitrate a late delivery.
        canWithdrawProblem: this.resource.isDisputed,
      },
      // Preloaded by the routes that need it; absent elsewhere rather than
      // silently null, so a missing preload can't read as "no problem open".
      disputes: DisputeTransformer.transform(this.whenLoaded(this.resource.disputes)),
      subtotalCents: Number(this.resource.subtotalCents),
      shippingCents: Number(this.resource.shippingCents),
      totalCents: Number(this.resource.subtotalCents) + Number(this.resource.shippingCents),
      // What actually came back, rather than what was ordered — a cancelled
      // order the buyer was never charged for refunds nothing.
      refundedCents: Number(this.resource.refundedCents),
      isRefunded: this.resource.isRefunded,
      // `seller` and `items` must be preloaded before transforming.
      shop: {
        name: this.resource.seller.shopName,
        slug: this.resource.seller.slug,
      },
      shipping: {
        name: this.resource.shippingName,
        line1: this.resource.shippingLine1,
        line2: this.resource.shippingLine2,
        city: this.resource.shippingCity,
        postalCode: this.resource.shippingPostalCode,
        country: this.resource.shippingCountry,
      },
      contactEmail: this.resource.contactEmail,
      items: OrderItemTransformer.transform(this.resource.items),
    }
  }
}
