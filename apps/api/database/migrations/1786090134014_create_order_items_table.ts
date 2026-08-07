import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Every buyer-facing field is a snapshot, not a lookup.
 *
 * Product rows move underneath an order: sellers change prices, rename
 * options, delist items. A line that read live product data would show a
 * different price a month later, and a deleted variant would leave an order
 * unreadable. So title, option label, unit price and currency are copied at
 * purchase time and never touched again.
 *
 * `product_variant_id` is kept purely as a soft pointer so a seller can tie
 * a line back to their catalogue. It nulls rather than cascades — losing the
 * pointer is fine, losing the order is not.
 */
export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')

      table
        .uuid('product_variant_id')
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')

      table.string('product_title', 150).notNullable()
      table.string('product_slug', 180).notNullable()
      // "Lavender / Small", or empty for a product without options
      table.string('variant_label', 200).notNullable().defaultTo('')
      table.string('image_path', 255).nullable()

      table.bigInteger('unit_price_cents').notNullable()
      table.string('currency', 3).notNullable()
      table.integer('quantity').unsigned().notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('order_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
