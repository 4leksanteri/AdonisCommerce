import type Dispute from '#models/dispute'
import { BaseTransformer } from '@adonisjs/core/transformers'
import DisputeOrderTransformer from '#transformers/dispute_order_transformer'

/**
 * Everything needed to settle a dispute without leaving the page: who raised
 * it, what they said, what the order was, and whether the money is still on
 * the platform balance.
 *
 * Names and emails are included deliberately — this is the one surface where
 * a human has to contact both sides — and it is why the panel is gated.
 */
export default class StaffDisputeTransformer extends BaseTransformer<Dispute> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'reason',
        'detail',
        'status',
        'resolutionNote',
        'createdAt',
        'resolvedAt',
      ]),
      openedBy: {
        name: this.resource.openedBy?.fullName ?? null,
        email: this.resource.openedBy?.email ?? null,
      },
      resolvedBy: this.resource.resolvedBy
        ? { name: this.resource.resolvedBy.fullName, email: this.resource.resolvedBy.email }
        : null,
      /**
       * `.depth(2)` belongs on *this* transform, not on the outer one:
       * `transform()` bakes in a maxDepth of 1, so without it the order's own
       * `items` are silently dropped from the payload. Same reason product
       * options carry it.
       */
      order: DisputeOrderTransformer.transform(this.resource.order).depth(2),
    }
  }
}
