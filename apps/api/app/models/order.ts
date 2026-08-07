import { randomBytes } from 'node:crypto'
import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Seller from '#models/seller'
import OrderItem from '#models/order_item'

// No vowels, no 0/O or 1/I — a reference gets read down a phone line and
// typed back in, so ambiguous glyphs cost more than the extra entropy.
const REFERENCE_ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXYZ'
const REFERENCE_LENGTH = 8

export default class Order extends OrderSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  static async generateReference() {
    // ~29^8 combinations, so a collision is vanishingly unlikely; the loop is
    // there because "unlikely" isn't "impossible" and the column is unique.
    for (let attempt = 0; attempt < 5; attempt++) {
      const bytes = randomBytes(REFERENCE_LENGTH)
      const reference = Array.from(
        bytes,
        (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]
      ).join('')

      if (!(await this.query().where('reference', reference).first())) {
        return reference
      }
    }

    throw new Error('Could not generate a unique order reference')
  }
}
