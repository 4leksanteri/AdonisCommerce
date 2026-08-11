import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The shop's picture.
 *
 * A column rather than a row in `product_images`, because a shop has exactly
 * one and the relation would only ever hold a single member — the constraint
 * is worth more than the flexibility.
 *
 * Stores the filename, not a URL, matching `product_images.path`: where files
 * are served from is a deployment detail and should not be baked into every
 * row.
 */
export default class extends BaseSchema {
  protected tableName = 'sellers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('avatar_path', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar_path')
    })
  }
}
