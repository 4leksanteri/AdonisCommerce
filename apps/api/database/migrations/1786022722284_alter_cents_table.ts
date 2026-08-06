import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Moves money to integer minor units and gives every amount an explicit
 * currency.
 *
 * `decimal(10,2)` bakes in a two-decimal assumption that isn't true globally
 * (JPY has none, KWD has three), and it arrives in JavaScript as a float —
 * exactly the wrong type to sum cart lines with. Integer minor units are also
 * the shape Stripe's API expects (`amount: 1250`).
 *
 * Currency sits on `products` as well as `sellers` on purpose: the seller's
 * setting is what new products inherit, but each product records the unit its
 * prices were actually entered in. Without that, a shop switching from EUR to
 * SEK would silently reinterpret every existing €10 price as 10 kr.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('sellers', (table) => {
      table.string('currency', 3).notNullable().defaultTo('EUR')
    })

    this.schema.alterTable('products', (table) => {
      table.string('currency', 3).notNullable().defaultTo('EUR')
    })

    this.schema.alterTable('product_variants', (table) => {
      table.bigInteger('price_cents').nullable()
    })

    // Existing rows were all implicitly EUR at two decimals, so the backfill
    // is a straight scale-up. Rounded rather than truncated so nothing can
    // silently lose a cent.
    this.defer(async (db) => {
      await db.rawQuery('UPDATE product_variants SET price_cents = ROUND(price * 100)')
    })

    this.schema.alterTable('product_variants', (table) => {
      table.bigInteger('price_cents').notNullable().alter()
      table.dropColumn('price')
    })
  }

  async down() {
    this.schema.alterTable('product_variants', (table) => {
      table.decimal('price', 10, 2).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery('UPDATE product_variants SET price = price_cents / 100.0')
    })

    this.schema.alterTable('product_variants', (table) => {
      table.decimal('price', 10, 2).notNullable().alter()
      table.dropColumn('price_cents')
    })

    this.schema.alterTable('products', (table) => {
      table.dropColumn('currency')
    })

    this.schema.alterTable('sellers', (table) => {
      table.dropColumn('currency')
    })
  }
}
