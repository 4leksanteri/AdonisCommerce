import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Which language to write to this person in.
 *
 * Needed because order emails are sent from webhooks and background jobs,
 * where there is no request to read a locale from. Without it every
 * notification would go out in one language on a marketplace that is
 * deliberately bilingual — and the buyer who chose Finnish would get English
 * for everything that actually matters.
 *
 * Defaults to the app's default locale rather than Finnish: an existing row
 * tells us nothing about its owner's preference, and guessing wrong is worse
 * than falling back.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('locale', 5).notNullable().defaultTo('en')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('locale')
    })
  }
}
