import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Opt-out inventory tracking, for made-to-order and digital listings that
 * have no stock to count.
 *
 * A flag rather than a sentinel `stock_quantity` (-1 or null meaning
 * "unlimited") on purpose: the storefront makes several `stock_quantity > 0`
 * decisions, and every one of them would quietly read a sentinel as sold out.
 * A boolean forces each site to say what it means.
 *
 * Lives on `products` rather than `product_variants` because made-to-order is
 * a property of the item, not of one size of it — and it keeps the variant
 * grid from growing another column.
 */
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('tracks_inventory').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tracks_inventory')
    })
  }
}
