import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The curated taxonomy products are filed under.
 *
 * Structure only — everything a human reads lives in `category_translations`.
 * Names and slugs both need translating: the app localises pathnames
 * everywhere else, and a Finnish category page will do considerably better in
 * search at `/kategoria/keittio-ja-ruokailu` than at `/kategoria/kitchen`.
 *
 * Not kept in the language files, which was the first idea: those are served
 * whole to every visitor by `/api/translations/:locale`, so a taxonomy of any
 * size would ride along on every page load for the sake of the dozen names
 * one page needs. Categories are data, and they want managing from an admin
 * screen rather than a deploy.
 */
export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))

      /**
       * Flat to begin with — a deep tree over a small catalogue mostly
       * produces empty categories, which reads worse than having fewer. The
       * column is here so children cost rows rather than a migration.
       */
      table.uuid('parent_id').nullable().references('id').inTable('categories').onDelete('RESTRICT')

      table.integer('position').notNullable().defaultTo(0)
      // Retiring a category must not orphan the products filed under it, so
      // it is hidden rather than deleted.
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['parent_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
