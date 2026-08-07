import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Ties an order to the card charge that pays for it, and records what the
 * platform kept.
 *
 * `expires_at` exists because stock is decremented the moment the order is
 * written, before the card is charged. That is the right trade for handmade
 * goods — most listings are one-of-a-kind, and two buyers both paying for the
 * last item means refunding one of them. The cost is that an abandoned
 * checkout would hold the stock forever, so a `pending_payment` order gets a
 * deadline; past it, the reservation is released.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('payment_id').nullable().references('id').inTable('payments').onDelete('SET NULL')

      // Snapshot, not a recomputation: the commission rate will change, and
      // a seller's past statements must not change with it.
      table.bigInteger('platform_fee_cents').notNullable().defaultTo(0)
      // Set once the seller's share has actually been moved to their account.
      table.string('stripe_transfer_id', 255).nullable().unique()

      table.timestamp('expires_at').nullable()

      // Sweeping expired reservations is a "which of these is stale" query.
      table.index(['status', 'expires_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'expires_at'])
      table.dropColumn('expires_at')
      table.dropColumn('stripe_transfer_id')
      table.dropColumn('platform_fee_cents')
      table.dropColumn('payment_id')
    })
  }
}
