import { randomBytes } from 'node:crypto'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { OrderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Seller from '#models/seller'
import OrderItem from '#models/order_item'
import Payment from '#models/payment'
import Dispute from '#models/dispute'
import OrderMessage from '#models/order_message'

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
 * pending_payment ─paid─> paid ─accept─> accepted ─ship─> shipped ─┬─> completed
 *        │                  │                │                     │      ↑
 *        ├─ expired         └───── cancel ───┘                  disputed ─┘
 *        └─ cancelled                │                             │
 *                              (refunded)                    (or cancelled)
 * ```
 *
 * The seller's money moves at `completed`, not at `paid` — see
 * `payout_release_at` in the completion migration.
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
  'disputed',
  'completed',
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

/**
 * How long the seller's money is held after dispatch before it releases on
 * its own. Domestic post arrives in days; a parcel to Australia does not, and
 * a single worst-case window would make every Helsinki-to-Helsinki sale wait
 * three weeks for no reason.
 *
 * The buyer confirming receipt releases it immediately, so this is only ever
 * the ceiling.
 */
export const DOMESTIC_HOLD_DAYS = 14
export const INTERNATIONAL_HOLD_DAYS = 30

/**
 * When to ask the buyer whether it arrived. Roughly when a parcel plausibly
 * has, and far enough before the hold expires that answering still changes
 * anything.
 */
export const DOMESTIC_NUDGE_DAYS = 4
export const INTERNATIONAL_NUDGE_DAYS = 12

export default class Order extends OrderSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @belongsTo(() => Payment)
  declare payment: BelongsTo<typeof Payment>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @hasMany(() => Dispute)
  declare disputes: HasMany<typeof Dispute>

  @hasMany(() => OrderMessage)
  declare messages: HasMany<typeof OrderMessage>

  /** Paid for and waiting on the seller to say yes. */
  get canAccept() {
    return this.status === 'paid'
  }

  /** Accepted, so there is something to actually put in the post. */
  get canShip() {
    return this.status === 'accepted'
  }

  /**
   * Cancellable up to dispatch — after that the goods are gone and can't be
   * put back on the shelf — and again once the buyer reports a problem.
   *
   * The second case is the seller settling a dispute themselves rather than
   * waiting for us to arbitrate it. Most problems are a lost or damaged
   * parcel that the seller simply wants to refund, and routing every one of
   * those through staff would be slow for the buyer and unaffordable for the
   * platform. It refunds without restocking; see `refundOrder`.
   */
  get canCancel() {
    return (SELLER_ACTIONABLE as readonly string[]).includes(this.status) || this.isDisputed
  }

  /** A problem has been reported and nobody has settled it yet. */
  get isDisputed() {
    return this.status === 'disputed'
  }

  /**
   * The buyer closing the order out early. Worth offering rather than always
   * waiting out the hold: it is the fast path to the seller being paid, and
   * someone who has the parcel in their hands has no reason to make them wait.
   */
  get canConfirmReceipt() {
    return this.status === 'shipped'
  }

  /**
   * Raising a problem is only possible between dispatch and completion. Before
   * dispatch the seller can just cancel; after completion the money has gone
   * and it is a returns conversation, which doesn't exist yet.
   */
  get canDispute() {
    return this.status === 'shipped'
  }

  /** True once the seller's share has actually left the platform balance. */
  get isPaidOut() {
    return this.stripeTransferId !== null
  }

  /**
   * Takes the seller's country rather than reading it off a relation, so
   * nothing silently depends on `seller` having been preloaded.
   */
  holdWindowDays(sellerCountry: string) {
    return this.isDomestic(sellerCountry) ? DOMESTIC_HOLD_DAYS : INTERNATIONAL_HOLD_DAYS
  }

  nudgeAfterDays(sellerCountry: string) {
    return this.isDomestic(sellerCountry) ? DOMESTIC_NUDGE_DAYS : INTERNATIONAL_NUDGE_DAYS
  }

  private isDomestic(sellerCountry: string) {
    return this.shippingCountry.toUpperCase() === sellerCountry.toUpperCase()
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
