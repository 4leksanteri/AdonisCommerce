import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A rating and a few words about something someone actually bought.
 *
 * Keyed to the **order item**, not to the product, which is what makes every
 * review a verified purchase and caps it at one per thing bought. Buying the
 * same mug twice earns two reviews, which is correct — they are two separate
 * experiences of it.
 *
 * `seller_id` is denormalised even though only products are rated today. It
 * costs nothing here, and it turns "show this shop its reviews" and any later
 * shop rating into a query rather than a migration.
 */
export default class extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))

      // One review per purchased line, enforced by the database rather than
      // by remembering to check.
      table
        .uuid('order_item_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('order_items')
        .onDelete('CASCADE')

      /**
       * Resolved from the order item's variant when the review is written.
       * Order items only hold a *soft* pointer to a variant, so the product
       * has to be pinned here or a later catalogue change would orphan the
       * review from the thing it is about.
       */
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.uuid('seller_id').notNullable().references('id').inTable('sellers').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // 1–5. Small integer because it is a rating, not a measurement.
      table.smallint('rating').notNullable()
      table.text('body').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // The product page reads these newest-first, and it is the only listing
      // that matters.
      table.index(['product_id', 'created_at'])
      table.index(['seller_id', 'created_at'])
    })

    // Belt and braces on the range: the validator checks it too, but a bad
    // rating would quietly poison the averages for good.
    this.schema.raw(
      `ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
