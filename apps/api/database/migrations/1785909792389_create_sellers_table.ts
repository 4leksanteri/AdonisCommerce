import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sellers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('shop_name', 100).notNullable()
      table.string('slug', 120).notNullable().unique()
      table.text('description').nullable()
      // pending, approved, rejected — instant-approved for now, manually
      // gated once the admin panel exists.
      table.string('status', 20).notNullable().defaultTo('approved')
      // not_connected, connected, restricted — stub for the future
      // Stripe Connect (or equivalent) payout integration.
      table.string('payout_status', 20).notNullable().defaultTo('not_connected')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}