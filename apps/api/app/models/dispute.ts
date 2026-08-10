import { DisputeSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Order from '#models/order'

/** Why the buyer says the order went wrong. */
export const DISPUTE_REASONS = ['not_received', 'damaged', 'not_as_described', 'other'] as const

export type DisputeReason = (typeof DISPUTE_REASONS)[number]

/**
 * `withdrawn` is the buyer taking it back; the two `resolved_*` values are
 * decisions, and which one it is says where the money went.
 */
export const DISPUTE_STATUSES = [
  'open',
  'resolved_refunded',
  'resolved_released',
  'withdrawn',
] as const

export default class Dispute extends DisputeSchema {
  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'openedByUserId' })
  declare openedBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'resolvedByUserId' })
  declare resolvedBy: BelongsTo<typeof User>

  /** Only an open dispute holds the payout. */
  get isOpen() {
    return this.status === 'open'
  }
}
