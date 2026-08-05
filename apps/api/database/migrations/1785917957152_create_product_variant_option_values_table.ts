import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_option_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('product_variant_id')
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table
        .uuid('product_option_value_id')
        .notNullable()
        .references('id')
        .inTable('product_option_values')
        .onDelete('CASCADE')

      table.unique(['product_variant_id', 'product_option_value_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
