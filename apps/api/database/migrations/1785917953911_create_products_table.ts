import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('seller_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sellers')
        .onDelete('CASCADE')
      table.string('title', 150).notNullable()
      table.string('slug', 180).notNullable().unique()
      table.text('description').nullable()
      // draft, active, archived
      table.string('status', 20).notNullable().defaultTo('draft')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
