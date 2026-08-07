import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Every webhook event we have already handled.
 *
 * Stripe guarantees *at least once* delivery, not exactly once — the same
 * `payment_intent.succeeded` can arrive twice, and paying a seller twice for
 * one order is not a recoverable mistake. The event id is the primary key, so
 * the insert itself is the lock: a duplicate delivery collides and is skipped.
 */
export default class extends BaseSchema {
  protected tableName = 'stripe_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Stripe's own id (evt_...), not ours — that is the whole point.
      table.string('id', 255).primary()
      table.string('type', 100).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
