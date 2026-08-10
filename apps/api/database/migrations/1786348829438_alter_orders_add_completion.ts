import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Closing an order out, and holding the seller's money until it closes.
 *
 * Until now the transfer fired the moment the card cleared, which meant the
 * seller was paid before the buyer had anything in their hands. If the parcel
 * then never arrived, the refund had to claw money back out of the seller's
 * account — and that can simply fail once Stripe has paid it onward. Holding
 * the transfer until the order completes removes the clawback from the common
 * case entirely.
 *
 * `payout_release_at` is set when the order ships and is the *authority* on
 * when the money moves. The queue only carries out what this column already
 * says, so a flushed Redis loses timeliness, never the obligation.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Set when the buyer confirms, or when the hold lapses on its own.
      table.timestamp('completed_at').nullable()
      table.timestamp('payout_release_at').nullable()

      // "Which orders are due to pay out" is the sweep's only question.
      table.index(['status', 'payout_release_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['status', 'payout_release_at'])
      table.dropColumn('payout_release_at')
      table.dropColumn('completed_at')
    })
  }
}
