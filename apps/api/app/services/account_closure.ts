import { randomBytes } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import TransactionalNotification from '#mails/transactional_notification'
import User from '#models/user'
import Order from '#models/order'
import Seller from '#models/seller'
import { toLocale } from '#services/translations'

/**
 * An order in one of these is finished with. Anything else still has money
 * or goods moving, and you cannot erase a party to a transaction mid-flight.
 */
const SETTLED_STATUSES = ['completed', 'cancelled', 'expired']

/**
 * Closing an account **anonymises the row**; it never deletes it.
 *
 * `orders.user_id` and `orders.seller_id` both RESTRICT, so anyone who has
 * ever bought or sold cannot be deleted at all — those are financial records
 * with retention obligations attached. Erasure therefore has to mean clearing
 * the personal fields in place, which is also what keeps the other side of
 * every conversation, review and order intact. See the docblock on the User
 * model, which the foreign keys were designed around.
 */
export type ClosureBlocker = 'ADMIN_CANNOT_CLOSE_OWN_ACCOUNT' | 'ORDERS_STILL_OPEN'

export async function blockerFor(user: User): Promise<ClosureBlocker | null> {
  /**
   * Same reasoning as refusing self-demotion: an admin closing their own
   * account could be the last one, and the screen that would undo it is the
   * one they just erased themselves out of. Another admin demotes them first.
   */
  if (user.isAdmin) return 'ADMIN_CANNOT_CLOSE_OWN_ACCOUNT'

  const seller = await Seller.findBy('userId', user.id)

  const open = await Order.query()
    .where((match) => {
      match.where('userId', user.id)
      if (seller) match.orWhere('sellerId', seller.id)
    })
    .whereNotIn('status', SETTLED_STATUSES)
    .first()

  return open ? 'ORDERS_STILL_OPEN' : null
}

/**
 * Wipes the personal data and shuts off anything the account still drives.
 *
 * Deliberately one transaction: a half-closed account — name gone but still
 * signed in, or shop still selling under a person who no longer exists — is
 * worse than either outcome.
 */
export async function closeAccount(user: User) {
  // Sent first, while there is still an address to send it to.
  await sendFarewell(user)

  await db.transaction(async (trx) => {
    user.useTransaction(trx)

    const seller = await Seller.query({ client: trx }).where('userId', user.id).first()
    if (seller) {
      // The storefront only shows `approved` shops, so this takes the shop
      // and everything in it out of circulation without touching the
      // products — which orders still point at.
      seller.status = 'closed'
      await seller.save()
    }

    user.fullName = null
    /**
     * `.invalid` is reserved by RFC 2606 and can never resolve, so nothing
     * can ever be delivered here by accident. Keyed by id, which keeps the
     * unique constraint on `email` satisfied.
     */
    user.email = `deleted-${user.id}@deleted.invalid`
    // Unknowable rather than empty: an account with no password must not be
    // one that any empty string can sign into.
    user.password = randomBytes(32).toString('hex')
    // Staff and admin rights do not survive their holder.
    user.role = 'customer'
    await user.save()
  })

  // Outside the transaction: these are their own rows and failing to drop a
  // token must not roll back the erasure.
  const tokens = await User.accessTokens.all(user)
  await Promise.all(tokens.map((token) => User.accessTokens.delete(user, token.identifier)))
}

async function sendFarewell(user: User) {
  try {
    await mail.sendLater(
      new TransactionalNotification({
        to: user.email,
        locale: toLocale(user.locale),
        template: 'accountClosed',
      })
    )
  } catch (error) {
    logger.error({ err: error, to: user.email }, 'Could not queue an account closure email')
  }
}
