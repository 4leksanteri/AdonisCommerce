import { BaseSchema } from '@adonisjs/lucid/schema'

/** The messages in a direct conversation. Mirrors `order_messages`. */
export default class extends BaseSchema {
  protected tableName = 'conversation_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuidv7()'))
      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')

      // SET NULL for the same reason as reviews and order messages: erasing
      // an account clears the personal data without deleting half of a
      // conversation the other party still has.
      table.uuid('sender_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      /**
       * `buyer` or `seller`, snapshotted. Derivable from the conversation
       * today, but only while nothing changes — a shop can change hands, and
       * who someone was when they wrote is a fact about the message.
       */
      table.string('sender_role', 10).notNullable()
      table.text('body').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // The only way this is ever read: one thread, oldest first.
      table.index(['conversation_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
