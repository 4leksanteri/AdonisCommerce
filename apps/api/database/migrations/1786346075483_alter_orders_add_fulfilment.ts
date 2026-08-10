import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * What happened to an order after it was paid for: accepted by the seller,
 * shipped, or cancelled and refunded.
 *
 * `accepted_at` exists because these are largely made-to-order goods. Paying
 * is the buyer agreeing; someone still has to confirm they can actually make
 * the thing, and until they have, the order is a request rather than a
 * commitment. Etsy has no equivalent and its sellers work around it.
 *
 * The refund is recorded as *data on the order* rather than as another
 * `status`. "Cancelled" is the same fact whether or not money had already
 * changed hands, and splitting it into `cancelled` and `refunded` would give
 * two states that answer the same question. Shopify's two-axis model
 * (fulfilment status alongside financial status) is the mature version of
 * this and is where to go if partial refunds ever arrive; one axis plus these
 * columns is enough until then.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('accepted_at').nullable()
      table.timestamp('shipped_at').nullable()
      // Free text on purpose: sellers here post with Posti, Matkahuolto, DHL
      // and hand-delivery, and a carrier enum would be wrong within a month.
      table.string('tracking_number', 100).nullable()

      table.timestamp('cancelled_at').nullable()
      table.string('cancel_reason', 200).nullable()

      table.string('stripe_refund_id', 255).nullable().unique()
      // What the buyer got back. Kept separately from the order total so a
      // partial refund can be recorded later without a schema change.
      table.bigInteger('refunded_cents').notNullable().defaultTo(0)
      /**
       * Clawing the seller's share back can fail — Stripe has nothing to take
       * if the money already paid out to their bank. The refund still goes
       * ahead, because the buyer must be made whole either way, so a null
       * here on a refunded order means the platform is carrying that debt.
       */
      table.string('stripe_transfer_reversal_id', 255).nullable().unique()
    })

    /**
     * The old default predates payments and is now a state nothing leaves:
     * every order is written as `pending_payment` and moves on from there.
     * Existing `pending` rows are left alone — they are real history from
     * before Stripe, and rewriting them would be inventing a past.
     */
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 20).notNullable().defaultTo('pending_payment').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 20).notNullable().defaultTo('pending').alter()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_transfer_reversal_id')
      table.dropColumn('refunded_cents')
      table.dropColumn('stripe_refund_id')
      table.dropColumn('cancel_reason')
      table.dropColumn('cancelled_at')
      table.dropColumn('tracking_number')
      table.dropColumn('shipped_at')
      table.dropColumn('accepted_at')
    })
  }
}
