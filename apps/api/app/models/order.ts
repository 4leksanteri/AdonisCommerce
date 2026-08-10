import { randomBytes } from 'node:crypto'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Seller from '#models/seller'
import OrderItem from '#models/order_item'
import Payment from '#models/payment'

// No vowels, no 0/O or 1/I — a reference gets read down a phone line and
// typed back in, so ambiguous glyphs cost more than the extra entropy.
const REFERENCE_ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXYZ'
const REFERENCE_LENGTH = 10

/**
 * How long an unpaid order keeps its stock reserved. Long enough to fetch a
 * different card or clear a 3-D Secure challenge; short enough that a
 * one-of-a-kind item isn't unbuyable for the rest of the day.
 */
export const PAYMENT_WINDOW_MINUTES = 30

/**
 * ```
 * pending_payment ──paid──> paid ──accept──> accepted ──ship──> shipped
 *        │                    │                  │
 *        ├─ expired           └────── cancel ─────┘
 *        └─ cancelled                    │
 *                                   (refunded)
 * ```
 *
 * `pending` is not in here: it is what every order carried before payments
 * existed, and those rows are kept as they are rather than rewritten into a
 * state they were never in.
 */
export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'accepted',
  'shipped',
  'cancelled',
  'expired',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/**
 * A paid order waits for the seller to take it on. Accepting is a promise to
 * make and send the thing, which for made-to-order work is a decision, not a
 * formality — so nothing moves until they make it.
 */
const SELLER_ACTIONABLE = ['paid', 'accepted'] as const

export default class Order extends OrderSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @belongsTo(() => Payment)
  declare payment: BelongsTo<typeof Payment>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  /** Paid for and waiting on the seller to say yes. */
  get canAccept() {
    return this.status === 'paid'
  }

  /** Accepted, so there is something to actually put in the post. */
  get canShip() {
    return this.status === 'accepted'
  }

  /**
   * Cancellable right up to the moment it goes in the post, and not after:
   * once the parcel is gone the goods can't be put back on the shelf, and
   * getting them back is a returns flow with its own conversation.
   */
  get canCancel() {
    return (SELLER_ACTIONABLE as readonly string[]).includes(this.status)
  }

  /** True once money has actually moved back to the buyer. */
  get isRefunded() {
    return this.stripeRefundId !== null
  }

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
