import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table.uuid('seller_id').notNullable().references('id').inTable('sellers').onDelete('CASCADE')
      table.string('title', 150).notNullable()
      // Unique per shop, not platform-wide — public URLs are
      // /<shop-slug>/<product-slug>, so two sellers can both own
      // "ceramic-mug" without either being pushed to "ceramic-mug-2".
      table.string('slug', 180).notNullable()
      table.text('description').nullable()
      // draft, active, archived
      table.string('status', 20).notNullable().defaultTo('draft')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['seller_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
