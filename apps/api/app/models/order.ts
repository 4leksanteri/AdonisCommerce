import { randomBytes } from 'node:crypto'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Seller from '#models/seller'
import OrderItem from '#models/order_item'

// No vowels, no 0/O or 1/I — a reference gets read down a phone line and
// typed back in, so ambiguous glyphs cost more than the extra entropy.
const REFERENCE_ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXYZ'
const REFERENCE_LENGTH = 10

export default class Order extends OrderSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  /**
   * Takes the caller's transaction client on purpose. Querying on the default
   * connection instead would make one order hold *two* pool connections at
   * once — its transaction plus this check — and a pool where every slot is
   * an order transaction waiting for a second connection deadlocks until the
   * acquire timeout fires.
   */
  static async generateReference(client?: TransactionClientContract) {
    // ~29^10 combinations — 420 trillion. The loop exists because "unlikely"
    // isn't "impossible" and the column is unique; a clash costs one extra
    // query rather than failing. References already issued at 8 characters
    // stay valid: lookup is an exact match and the column allows 12.
    for (let attempt = 0; attempt < 5; attempt++) {
      const bytes = randomBytes(REFERENCE_LENGTH)
      const reference = Array.from(
        bytes,
        (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]
      ).join('')

      if (!(await this.query({ client }).where('reference', reference).first())) {
        return reference
      }
    }

    throw new Error('Could not generate a unique order reference')
  }
}
