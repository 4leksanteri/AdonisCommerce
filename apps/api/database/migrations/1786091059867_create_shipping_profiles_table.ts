import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Reusable shipping rates — "Small parcel", "Large parcel" — rather than four
 * numbers repeated on every product.
 *
 * A rate set describes a *class* of item, not one item, so a seller shipping
 * both soaps and framed prints needs two of them. Storing the numbers on each
 * product would duplicate shared data and, worse, mean re-editing every
 * listing when postage prices change.
 *
 * `destination` is a country code or `*` for everywhere else, instead of two
 * fixed domestic/international columns. That way a seller can add a cheaper
 * rate for a neighbouring country later without a schema change.
 */
export default class extends BaseSchema {
  async up() {
    // "Domestic" is meaningless without knowing where a shop ships from.
    this.schema.alterTable('sellers', (table) => {
      table.string('country', 2).notNullable().defaultTo('FI')
    })

    this.schema.createTable('shipping_profiles', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('seller_id')
        .notNullable()
        .references('id')
        .inTable('sellers')
        .onDelete('CASCADE')
      table.string('name', 60).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['seller_id', 'name'])
    })

    this.schema.createTable('shipping_rates', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('shipping_profile_id')
        .notNullable()
        .references('id')
        .inTable('shipping_profiles')
        .onDelete('CASCADE')

      // ISO 3166-1 alpha-2, or '*' meaning everywhere not listed explicitly
      table.string('destination', 2).notNullable()
      table.bigInteger('first_item_cents').notNullable()
      // Charged per extra unit — three mugs don't cost three single postages
      table.bigInteger('additional_item_cents').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['shipping_profile_id', 'destination'])
    })

    this.schema.alterTable('products', (table) => {
      // Null means the seller ships this one free — deliberate, since the
      // form preselects a profile when the shop has any.
      table
        .uuid('shipping_profile_id')
        .nullable()
        .references('id')
        .inTable('shipping_profiles')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('products', (table) => table.dropColumn('shipping_profile_id'))
    this.schema.dropTable('shipping_rates')
    this.schema.dropTable('shipping_profiles')
    this.schema.alterTable('sellers', (table) => table.dropColumn('country'))
  }
}
