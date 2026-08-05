import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_option_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('product_option_id')
        .notNullable()
        .references('id')
        .inTable('product_options')
        .onDelete('CASCADE')
      // e.g. "Small", "Red"
      table.string('value', 60).notNullable()
      // display order among an option's values
      table.integer('position').unsigned().notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['product_option_id', 'value'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
