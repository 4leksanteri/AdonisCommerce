import { PaymentSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Order from '#models/order'

/** A payment is settled and nothing more will change on it. */
export const TERMINAL_PAYMENT_STATUSES = ['succeeded', 'canceled'] as const

export default class Payment extends PaymentSchema {
  /**
   * Stripe's one-time secret authorising the browser to confirm *this*
   * payment. Held in memory only — it is derived from the PaymentIntent, is
   * useless once the payment settles, and storing it would put a live
   * credential in the database for no gain.
   */
  declare clientSecret?: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** One card charge can cover several shops' orders. */
  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  get isTerminal() {
    return (TERMINAL_PAYMENT_STATUSES as readonly string[]).includes(this.status)
  }
}
