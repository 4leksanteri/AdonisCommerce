import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * One order per seller — a marketplace basket spanning three shops becomes
 * three orders, because each is fulfilled, paid and refunded separately.
 * The cart already groups this way.
 *
 * The shipping address is copied onto the row rather than referenced. An
 * order is a record of what was agreed at a point in time; a customer later
 * editing their saved address must not rewrite where a past parcel went.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      // Short, human-quotable, and not enumerable — "K7M2P9X4" rather than a
      // 36-character uuid or a sequence that leaks how many orders exist.
      table.string('reference', 12).notNullable().unique()

      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('seller_id').notNullable().references('id').inTable('sellers').onDelete('RESTRICT')

      // pending, paid, shipped, cancelled — only `pending` until payments land
      table.string('status', 20).notNullable().defaultTo('pending')

      table.string('currency', 3).notNullable()
      table.bigInteger('subtotal_cents').notNullable()

      table.string('contact_email', 254).notNullable()
      table.string('shipping_name', 150).notNullable()
      table.string('shipping_line_1', 200).notNullable()
      table.string('shipping_line_2', 200).nullable()
      table.string('shipping_city', 100).notNullable()
      table.string('shipping_postal_code', 20).notNullable()
      table.string('shipping_country', 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['user_id', 'created_at'])
      table.index(['seller_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
