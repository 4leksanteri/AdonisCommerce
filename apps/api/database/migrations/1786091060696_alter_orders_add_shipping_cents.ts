import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Shipping is snapshotted onto the order like every other amount — the rate
 * that applied at purchase time, not whatever the profile says next month.
 * Existing rows default to zero, which is what they were charged.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('shipping_cents').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('shipping_cents')
    })
  }
}
