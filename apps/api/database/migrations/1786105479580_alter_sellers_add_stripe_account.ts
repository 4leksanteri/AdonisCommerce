import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The seller's Stripe Connect (Express) account. Stripe hosts onboarding and
 * KYC, so the identity documents and per-country requirements never touch our
 * database — only this id does.
 *
 * Unique because two shops sharing a payout account would make transfers
 * ambiguous; nullable because a seller exists long before they connect one.
 */
export default class extends BaseSchema {
  protected tableName = 'sellers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('stripe_account_id', 255).nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_account_id')
    })
  }
}
