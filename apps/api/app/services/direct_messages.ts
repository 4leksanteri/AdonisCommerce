import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import type Seller from '#models/seller'
import type User from '#models/user'
import type { DirectSenderRole } from '#models/conversation_message'

export type DirectParticipation = {
  conversation: Conversation
  role: DirectSenderRole
}

/**
 * Who is allowed into a direct conversation, and as what.
 *
 * The entire authorization surface for private messaging, kept in one place
 * for the same reason as `participationFor` on order threads: two callers
 * asking the question separately is how one of them ends up more permissive.
 *
 * Note what is *not* here — there is no staff branch. Nobody arbitrates a
 * private conversation, so nobody outside it gets to read it.
 */
export async function directParticipationFor(
  user: User,
  conversationId: string
): Promise<DirectParticipation | null> {
  const conversation = await Conversation.query()
    .where('id', conversationId)
    .preload('seller')
    .preload('buyer')
    .first()

  if (!conversation) return null

  if (conversation.buyerUserId === user.id) return { conversation, role: 'buyer' }
  if (conversation.seller.userId === user.id) return { conversation, role: 'seller' }

  return null
}

/**
 * The thread between this person and this shop, made if it is their first
 * word to each other.
 *
 * `ON CONFLICT DO NOTHING` against the unique pair rather than a read
 * followed by a write: two "Contact shop" submissions racing each other
 * would otherwise both find nothing and both insert, and the loser gets a
 * constraint violation in place of their message.
 */
export async function findOrStartConversation(
  buyer: User,
  seller: Seller
): Promise<Conversation | null> {
  // Talking to yourself is not a feature. Sellers buy from other shops, so
  // this is only ever the shop's own owner reaching their own contact button.
  if (seller.userId === buyer.id) return null

  const now = DateTime.now().toSQL()!

  await db.rawQuery(
    `insert into conversations (buyer_user_id, seller_id, created_at, updated_at)
     values (?, ?, ?, ?)
     on conflict (buyer_user_id, seller_id) do nothing`,
    [buyer.id, seller.id, now, now]
  )

  const conversation = await Conversation.query()
    .where('buyerUserId', buyer.id)
    .where('sellerId', seller.id)
    .preload('seller')
    .preload('buyer')
    .firstOrFail()

  return conversation
}

/**
 * True when this person has written here recently enough to plainly still be
 * reading — the same test order threads use before emailing someone about a
 * reply they are watching arrive.
 */
const PRESENT_WITHIN_MINUTES = 5

export async function isPresentInConversation(conversationId: string, userId: string) {
  const recent = await db
    .from('conversation_messages')
    .where('conversation_id', conversationId)
    .where('sender_user_id', userId)
    .where('created_at', '>', DateTime.now().minus({ minutes: PRESENT_WITHIN_MINUTES }).toSQL()!)
    .first()

  return recent !== undefined && recent !== null
}
