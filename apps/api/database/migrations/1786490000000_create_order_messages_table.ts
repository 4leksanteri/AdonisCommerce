import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * One conversation per order, between the buyer and the shop.
 *
 * Anchored on the order rather than on a dispute on purpose. If the only way
 * to reach a seller were to report a problem, people would report problems in
 * order to ask "has this shipped?" — and every one of those would hold a
 * payout. Ordinary questions and disputes share the same thread; a dispute
 * just points at a conversation that already exists.
 *
 * Named for what it is rather than a generic `messages`: real general
 * messaging wants conversations with participants and per-person read state,
 * so this table would be restructured either way. Claiming that generality in
 * the name now would only mislead.
 */
export default class extends BaseSchema {
  protected tableName = 'order_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')

      /**
       * SET NULL rather than CASCADE, matching reviews: erasing an account
       * clears the personal data but must not silently delete half of a
       * conversation the other party — or an arbitrator — still needs.
       */
      table.uuid('sender_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      /**
       * buyer, seller or staff — snapshotted at send time.
       *
       * It is *derivable* today (the order knows its buyer and its shop) but
       * only for as long as nothing changes: staff is a role that gets granted
       * and revoked, and a shop can change hands. Who someone was when they
       * wrote the message is a fact about the message, and it also survives
       * the sender being anonymised.
       */
      table.string('sender_role', 10).notNullable()
      table.text('body').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // The only way this is ever read: one thread, oldest first.
      table.index(['order_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
