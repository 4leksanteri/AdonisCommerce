import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * One row per Stripe PaymentIntent — and one PaymentIntent can cover several
 * orders, because a basket spanning three shops is three orders but one card
 * charge. `orders.payment_id` points back here.
 *
 * A PaymentIntent has exactly one currency, so a basket mixing EUR and SEK
 * becomes two payments rather than an invented exchange rate the sellers
 * never agreed to.
 *
 * We take the whole amount onto the platform account and pay each seller with
 * a separate Transfer ("separate charges and transfers"). The platform is
 * merchant of record, so the buyer sees one line on their statement.
 */
export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')

      // Null for the moment between committing the orders and Stripe
      // answering: the intent is created after the transaction commits,
      // because a network call must never be made holding row locks.
      table.string('stripe_payment_intent_id', 255).nullable().unique()

      table.string('currency', 3).notNullable()
      // What the buyer is charged: every covered order's items plus shipping.
      table.bigInteger('amount_cents').notNullable()

      // Stripe's own PaymentIntent statuses, stored verbatim so there is no
      // second vocabulary to keep in sync:
      // requires_payment_method, requires_confirmation, requires_action,
      // processing, succeeded, canceled.
      table.string('status', 30).notNullable().defaultTo('requires_payment_method')
      // Last decline/failure reason, for showing the buyer why a card failed.
      table.text('last_error').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
