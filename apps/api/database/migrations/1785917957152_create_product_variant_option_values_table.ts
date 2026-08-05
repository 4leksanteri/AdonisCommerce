import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_option_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('product_variant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table
        .integer('product_option_value_id')
        .unsigned()
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
