import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The shop's name as it was when the order was placed.
 *
 * Everything else on an order is already a snapshot — title, variant, price,
 * image, address — precisely so the record says what was agreed rather than
 * what is true now. The shop name was the one thing still read live off the
 * seller, so renaming a shop retroactively rewrote every order anyone had
 * ever placed with it, telling buyers they had bought from somewhere they had
 * never heard of.
 *
 * The slug is deliberately not snapshotted: renaming a shop leaves it alone,
 * so a link built from it still resolves.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('shop_name', 100).nullable()
    })

    // Existing orders get today's name — the only one we have. It is right
    // for every shop that has not been renamed, which is all of them so far.
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE orders o SET shop_name = s.shop_name FROM sellers s WHERE s.id = o.seller_id`
      )
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('shop_name', 100).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('shop_name')
    })
  }
}
