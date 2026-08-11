import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A category's name and slug in one language.
 *
 * A table rather than `name_en` / `name_fi` columns: that would be four
 * columns for two locales and six the moment Swedish appears, which isn't
 * far-fetched on a platform that already takes SEK. A third language should
 * be rows, not a migration.
 */
export default class extends BaseSchema {
  protected tableName = 'category_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('category_id')
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')

      table.string('locale', 5).notNullable()
      table.string('name', 100).notNullable()
      table.string('slug', 120).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // One name per category per language...
      table.unique(['category_id', 'locale'])
      // ...and no two categories fighting over the same URL in one language.
      table.unique(['locale', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
