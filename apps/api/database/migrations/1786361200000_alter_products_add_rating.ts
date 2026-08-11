import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Running totals so a product listing doesn't have to aggregate reviews.
 *
 * Kept as a **sum and a count** rather than an average. Both are integers, so
 * adding or removing a review is exact arithmetic with no rounding drift, and
 * the average is a division done at read time where it belongs. Storing a
 * float average instead would accumulate error every time it was recomputed.
 *
 * Denormalised because the product grid is the hottest page on the storefront
 * and a per-product aggregate there is a join it doesn't need.
 */
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('rating_count').notNullable().defaultTo(0)
      table.integer('rating_sum').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('rating_sum')
      table.dropColumn('rating_count')
    })
  }
}
