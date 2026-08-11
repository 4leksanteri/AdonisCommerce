import { OrderMessageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Order from '#models/order'

/** Who someone was to this order when they wrote — see the migration. */
export const SENDER_ROLES = ['buyer', 'seller', 'staff'] as const
export type SenderRole = (typeof SENDER_ROLES)[number]

export default class OrderMessage extends OrderMessageSchema {
  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'senderUserId' })
  declare sender: BelongsTo<typeof User>
}
