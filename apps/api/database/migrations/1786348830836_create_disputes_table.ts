import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A buyer saying something went wrong, and what was eventually done about it.
 *
 * Its own table rather than a few columns on `orders` because a dispute has a
 * shape of its own: who raised it, why, who settled it and how. Columns would
 * capture the first and none of the rest, and the staff tooling that has to
 * adjudicate these is coming — this is the table it will be built over.
 *
 * An open dispute holds the seller's payout. That is the whole point: without
 * it the buyer's only remaining lever is a card chargeback, which costs a fee,
 * is decided by their bank rather than by us, and counts against the
 * platform's Stripe account.
 */
export default class extends BaseSchema {
  protected tableName = 'disputes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('opened_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      // not_received, damaged, not_as_described, other
      table.string('reason', 30).notNullable()
      table.text('detail').nullable()

      // open, resolved_refunded, resolved_released, withdrawn
      table.string('status', 30).notNullable().defaultTo('open')
      table.text('resolution_note').nullable()
      /**
       * Null while open, and null on a dispute the buyer withdrew or the two
       * parties settled between themselves. Populated once staff adjudication
       * exists and someone actually decides one.
       */
      table
        .uuid('resolved_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('resolved_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['status', 'created_at'])
    })

    /**
     * One *open* dispute per order. Partial rather than a plain unique index,
     * so an order can be disputed again after an earlier case closed — the
     * history is worth keeping, a second simultaneous case is not.
     */
    this.schema.raw(
      `CREATE UNIQUE INDEX disputes_one_open_per_order
         ON disputes (order_id)
      WHERE status = 'open'`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
