import Order from '#models/order'
import type User from '#models/user'
import type { SenderRole } from '#models/order_message'

export type Participation = {
  order: Order
  role: SenderRole
  /** Staff may read a thread before they are entitled to join it. */
  canPost: boolean
}

/**
 * Decides who is allowed into an order's conversation, and as what.
 *
 * The whole authorization surface for messaging is this one function. Three
 * roles reach the same thread from three different pages, and spreading the
 * rules across those pages is how one of them ends up subtly more permissive
 * than the others.
 *
 * Returns null for anyone with no business here, which the callers turn into
 * a 404 — a stranger should not learn that an order exists.
 */
export async function participationFor(user: User, orderId: string): Promise<Participation | null> {
  const order = await Order.query()
    .where('id', orderId)
    .preload('seller')
    .preload('disputes')
    .first()

  if (!order) return null

  if (order.userId === user.id) return { order, role: 'buyer', canPost: true }
  if (order.seller.userId === user.id) return { order, role: 'seller', canPost: true }

  /**
   * Staff are not general readers. They get in when there is a case on the
   * order — open or already settled, since understanding a past decision
   * means being able to read what led to it — and not before. Being able to
   * browse strangers' conversations without a reason is not a power the
   * panel needs.
   */
  if (user.canAccessStaffPanel && order.disputes.length > 0) {
    return { order, role: 'staff', canPost: order.disputes.some((dispute) => dispute.isOpen) }
  }

  return null
}
