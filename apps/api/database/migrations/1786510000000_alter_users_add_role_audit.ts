import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Who last changed this person's role, and when.
 *
 * Granting staff or admin is the most consequential action in the product —
 * it hands someone the ability to settle disputes and move other people's
 * money. Making that possible from a screen is reasonable; making it possible
 * *anonymously* is not, and "who did this" is the first question anybody asks
 * afterwards.
 *
 * Last-change only, not a history. A full audit log is its own table and
 * should cover more than roles; this answers the common question for the cost
 * of two columns, and doesn't pretend to be the audit trail.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // SET NULL rather than RESTRICT: an admin leaving must not be blocked
      // by having once promoted somebody.
      table
        .uuid('role_changed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('role_changed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role_changed_at')
      table.dropColumn('role_changed_by_user_id')
    })
  }
}
