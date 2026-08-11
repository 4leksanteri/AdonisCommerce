import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * What a product is.
 *
 * Nullable in the database because products already exist and none of them
 * have one, but **required by the validator** when a product is created or
 * saved. The whole point of adding this before browse exists is to have the
 * data when browse arrives, and an optional field on a seller form is a field
 * that gets skipped. Older products pick one up the next time they are
 * edited.
 *
 * RESTRICT rather than SET NULL: a category with products in it should be
 * hidden via `is_active`, not deleted out from under them.
 */
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('category_id')
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')

      // "Everything in this category" is the only question this is ever asked.
      table.index(['category_id', 'status'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['category_id', 'status'])
      table.dropColumn('category_id')
    })
  }
}
