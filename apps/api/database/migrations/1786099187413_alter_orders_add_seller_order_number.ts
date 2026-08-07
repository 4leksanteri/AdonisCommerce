import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A per-shop running order number, for humans.
 *
 * `reference` stays the canonical identifier — globally unique, unguessable,
 * and what the URL uses. This is display only: a seller packing boxes would
 * rather say "order 1042" than "order N2T8LFR6RG", and Shopify has trained
 * everyone to expect it.
 *
 * The counter lives on `sellers` so it can be bumped atomically in one
 * statement. Deriving it from `MAX(seller_order_number) + 1` would let two
 * concurrent orders read the same maximum and collide.
 *
 * Starts at 1001 rather than 1 — a shop's first order reading "#1" tells every
 * customer exactly how new the shop is.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('sellers', (table) => {
      table.integer('next_order_number').unsigned().notNullable().defaultTo(1001)
    })

    this.schema.alterTable('orders', (table) => {
      table.integer('seller_order_number').unsigned().nullable()
    })

    // Backfills existing rows in creation order, per seller.
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE orders SET seller_order_number = numbered.row_number + 1000
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY created_at) AS row_number
          FROM orders
        ) AS numbered
        WHERE orders.id = numbered.id
      `)
      await db.rawQuery(`
        UPDATE sellers SET next_order_number = COALESCE(
          (SELECT MAX(seller_order_number) + 1 FROM orders WHERE orders.seller_id = sellers.id),
          1001
        )
      `)
    })

    this.schema.alterTable('orders', (table) => {
      table.integer('seller_order_number').unsigned().notNullable().alter()
      table.unique(['seller_id', 'seller_order_number'])
    })
  }

  async down() {
    this.schema.alterTable('orders', (table) => {
      table.dropUnique(['seller_id', 'seller_order_number'])
      table.dropColumn('seller_order_number')
    })
    this.schema.alterTable('sellers', (table) => {
      table.dropColumn('next_order_number')
    })
  }
}
