import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Direct messages between a shopper and a shop, outside any order.
 *
 * The questions that decide whether an order happens at all — "can you make
 * this in blue", "will it arrive before Christmas" — come *before* checkout,
 * and until now the only way to reach a seller was to have already bought
 * something. On a marketplace for handmade work that is backwards: the
 * conversation is often where the commission starts.
 *
 * Separate from `order_messages`, which stays as it is. That thread is
 * attached to a transaction, becomes evidence when a dispute is opened, and
 * is readable by staff for exactly that reason. Folding the two together
 * would mean either exposing every private conversation to the staff panel
 * or giving up the evidence trail. They are different things that happen to
 * both be typing.
 */
export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))

      /**
       * A thread is between a person and a *shop*, not two people. The seller
       * side is whoever holds the shop, so a shop changing hands hands over
       * its correspondence with it — which is what both parties expect.
       *
       * RESTRICT on both, like orders: accounts are anonymised rather than
       * deleted (see the note on the User model), so this never fires. It is
       * here to make sure a future delete has to think about it.
       */
      table
        .uuid('buyer_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.uuid('seller_id').notNullable().references('id').inTable('sellers').onDelete('RESTRICT')

      /**
       * Denormalised so the inbox can sort and page without touching the
       * messages table. An inbox is read constantly and written rarely.
       */
      table.timestamp('last_message_at').nullable()

      /**
       * Read state as two timestamps rather than a participants table with a
       * row each. A thread here has exactly two sides and always will —
       * modelling "any number of participants" would be inventing a problem.
       * Unread means: there is a message newer than the last time I looked,
       * and it wasn't mine.
       */
      table.timestamp('buyer_read_at').nullable()
      table.timestamp('seller_read_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // One thread per pair, forever — a second "conversation" with the same
      // shop is the same conversation continued.
      table.unique(['buyer_user_id', 'seller_id'])
      // The two inbox queries: mine as a buyer, mine as a shop, newest first.
      table.index(['buyer_user_id', 'last_message_at'])
      table.index(['seller_id', 'last_message_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
