import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Makes a review survive things being deleted around it.
 *
 * As first written, `product_id` cascaded — so deleting a product did not
 * merely strip a review of its context, it destroyed the reviews. That is the
 * wrong trade in both directions: reviews are other people's words about a
 * purchase that really happened, and losing them silently is worse than
 * refusing the delete.
 *
 * Three changes:
 *
 * - `product_id` now RESTRICTs. Products are archived rather than deleted
 *   (there is no delete endpoint), so this is a safety net that turns silent
 *   data loss into a loud error if that ever changes.
 * - The product's title and variant are snapshotted onto the review. They are
 *   already reachable through `order_item_id`, but that row cascades from the
 *   order, and a review should not depend on an order still existing to be
 *   able to say what it was about.
 * - `user_id` becomes nullable and SET NULL, so erasing an account anonymises
 *   its reviews instead of deleting them. See the account-deletion note in
 *   the User model.
 *
 * Scalar columns rather than a JSON blob: the shape is fixed and small, and
 * these stay queryable, indexable and checked by the database. `order_items`
 * already snapshots the same way.
 */
export default class extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('product_title', 150).nullable()
      table.string('variant_label', 255).nullable()
    })

    // Backfill from the order item each review is already keyed to.
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE reviews r
            SET product_title = oi.product_title,
                variant_label = oi.variant_label
           FROM order_items oi
          WHERE oi.id = r.order_item_id`
      )
    })

    // Only enforced once nothing is missing it.
    this.schema.alterTable(this.tableName, (table) => {
      table.string('product_title', 150).notNullable().alter()
      table.string('variant_label', 255).notNullable().defaultTo('').alter()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['product_id'])
      table.foreign('product_id').references('id').inTable('products').onDelete('RESTRICT')

      table.dropForeign(['user_id'])
      table.uuid('user_id').nullable().alter()
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['product_id'])
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')

      table.dropForeign(['user_id'])
      table.uuid('user_id').notNullable().alter()
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

      table.dropColumn('variant_label')
      table.dropColumn('product_title')
    })
  }
}
