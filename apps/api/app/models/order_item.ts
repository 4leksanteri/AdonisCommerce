import { OrderItemSchema } from '#database/schema'
import { belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'
import Review from '#models/review'

export default class OrderItem extends OrderItemSchema {
  /** At most one, enforced by a unique index on the review side. */
  @hasOne(() => Review)
  declare review: HasOne<typeof Review>

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
