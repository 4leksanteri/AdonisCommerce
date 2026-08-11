import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type Dispute from '#models/dispute'
import type Order from '#models/order'
import { refundOrder } from '#services/payments'
import { schedulePayoutRelease } from '#services/queue'

/**
 * The two ways a dispute ends, plus the buyer withdrawing it.
 *
 * Shared because a dispute can be settled from three places — the seller
 * refunding, the buyer withdrawing, or staff deciding — and all three have to
 * move the same money and leave the same trail. Three copies of that would
 * drift, and the one that drifted would be the one handling someone's refund.
 */

/**
 * The buyer is refunded and the order is called off.
 *
 * Deliberately does **not** restock: a dispute only exists after dispatch, so
 * the goods are in the post or gone. Crediting them back would invent stock
 * the seller does not have.
 */
export async function resolveWithRefund(
  order: Order,
  dispute: Dispute,
  resolvedByUserId: string,
  note: string | null
): Promise<void> {
  await refundOrder(order, note, false)

  dispute.status = 'resolved_refunded'
  dispute.resolvedByUserId = resolvedByUserId
  dispute.resolutionNote = note
  dispute.resolvedAt = DateTime.now()
  await dispute.save()
}

/**
 * The dispute is closed in the seller's favour and the payout resumes.
 *
 * The order goes back to `shipped` rather than straight to `completed`: the
 * hold may still have time left on it, and the buyer should keep the chance
 * to confirm receipt. If the deadline has already passed the sweep completes
 * it on the next tick, which is the right answer either way.
 */
export async function resolveWithRelease(
  order: Order,
  dispute: Dispute,
  resolvedByUserId: string,
  note: string | null
): Promise<void> {
  await db.transaction(async (trx) => {
    dispute.useTransaction(trx)
    dispute.status = 'resolved_released'
    dispute.resolvedByUserId = resolvedByUserId
    dispute.resolutionNote = note
    dispute.resolvedAt = DateTime.now()
    await dispute.save()

    order.useTransaction(trx)
    order.status = 'shipped'
    await order.save()
  })

  // Re-booked because the original job may already have run and been turned
  // away while the dispute was open.
  await schedulePayoutRelease(order)
}
