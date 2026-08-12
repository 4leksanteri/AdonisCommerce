import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'
import Conversation from '#models/conversation'
import ConversationMessage from '#models/conversation_message'
import Seller from '#models/seller'
import ConversationTransformer from '#transformers/conversation_transformer'
import ConversationMessageTransformer from '#transformers/conversation_message_transformer'
import { directParticipationFor, findOrStartConversation } from '#services/direct_messages'
import { notifyNewDirectMessage } from '#services/message_notifications'
import type { DirectSenderRole } from '#models/conversation_message'

const bodyValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(4000),
})

const startValidator = vine.create({
  shopSlug: vine.string().trim().minLength(1),
  body: vine.string().trim().minLength(1).maxLength(4000),
})

const PER_PAGE = 30

/**
 * Private messages between a shopper and a shop.
 *
 * One controller for both sides. Which inbox you get is a question of which
 * end of the conversation you are on, not which endpoint you called — and a
 * seller reading their shop's messages is doing the same thing a buyer is.
 */
export default class ConversationsController {
  /** The reader's inbox, from one side or the other. */
  async index({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const role: DirectSenderRole = request.input('as') === 'seller' ? 'seller' : 'buyer'
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    let sellerId: string | null = null
    if (role === 'seller') {
      const seller = await Seller.findBy('userId', user.id)
      // No shop, no shop inbox. Empty rather than an error: the seller panel
      // is unreachable without one anyway.
      if (!seller) return serialize({ conversations: [], unread: 0 })
      sellerId = seller.id
    }

    const conversations = await Conversation.query()
      .if(role === 'buyer', (query) => query.where('buyerUserId', user.id))
      .if(role === 'seller', (query) => query.where('sellerId', sellerId!))
      // Threads nobody has written in yet are not conversations.
      .whereNotNull('lastMessageAt')
      .preload('seller')
      .preload('buyer')
      // Just the newest message, for the excerpt and for whose turn it is.
      .preload('messages', (messages) => messages.orderBy('createdAt', 'desc').groupLimit(1))
      .orderBy('lastMessageAt', 'desc')
      .paginate(page, PER_PAGE)

    const rows = conversations.all()

    return serialize({
      // The array goes to `transform`, not a `map` over it: the serializer
      // only resolves transformers it is handed, and a hand-rolled array of
      // instances comes out as raw model dumps.
      conversations: ConversationTransformer.transform(rows, role),
      // Counted from this page only, which is what the inbox is showing. A
      // true unread badge wants its own query; there is no badge yet.
      unread: rows.filter((conversation) =>
        conversation.isUnreadFor(
          role,
          (conversation.messages?.at(0)?.senderRole ?? null) as DirectSenderRole | null
        )
      ).length,
      page: conversations.getMeta().currentPage,
      lastPage: conversations.getMeta().lastPage,
    })
  }

  /**
   * What each of the reader's inboxes has waiting, for the nav.
   *
   * No "and the last message wasn't mine" clause, which the equivalent check
   * on the model has: sending stamps your own read mark to the same instant
   * as the message, so your own writing can never satisfy `read_at <
   * last_message_at`. The two agree; this one is just the shape an index can
   * answer.
   */
  async unread({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.findBy('userId', user.id)

    const [buyer, shop] = await Promise.all([
      this.countUnread('buyer_user_id', user.id, 'buyer_read_at'),
      seller ? this.countUnread('seller_id', seller.id, 'seller_read_at') : Promise.resolve(0),
    ])

    return serialize({ buyer, seller: shop })
  }

  private async countUnread(ownerColumn: string, ownerId: string, readColumn: string) {
    const row = await db
      .from('conversations')
      .where(ownerColumn, ownerId)
      .whereNotNull('last_message_at')
      .where((match) => match.whereNull(readColumn).orWhereRaw(`${readColumn} < last_message_at`))
      .count('* as total')
      .first()

    return Number(row?.total ?? 0)
  }

  /**
   * One thread. Opening it is what marks it read — there is no separate
   * "mark as read" call to forget to make.
   */
  async show({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const participation = await directParticipationFor(user, params.id)
    if (!participation) return this.notFound(response)

    const { conversation, role } = participation

    const messages = await ConversationMessage.query()
      .where('conversationId', conversation.id)
      .preload('sender')
      .orderBy('createdAt', 'asc')

    if (role === 'buyer') conversation.buyerReadAt = DateTime.now()
    else conversation.sellerReadAt = DateTime.now()
    await conversation.save()

    return serialize({
      conversation: ConversationTransformer.transform(conversation, role),
      messages: ConversationMessageTransformer.transform(messages),
      role,
    })
  }

  /**
   * The "Contact shop" button. Addressed by shop slug rather than
   * conversation id, because the whole point is that the buyer has no idea
   * whether they have written to this shop before — and shouldn't need to.
   */
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { shopSlug, body } = await request.validateUsing(startValidator)

    const seller = await Seller.query().where('slug', shopSlug).where('status', 'approved').first()
    if (!seller) return this.notFound(response)

    const conversation = await findOrStartConversation(user, seller)
    if (!conversation) {
      return response.badRequest({
        errors: [{ code: 'CANNOT_MESSAGE_OWN_SHOP', message: 'This is your own shop.' }],
      })
    }

    const message = await this.append(conversation, user.id, 'buyer', body)
    await notifyNewDirectMessage(conversation, message)

    response.status(201)

    return serialize({
      conversation: ConversationTransformer.transform(conversation, 'buyer'),
      message: ConversationMessageTransformer.transform(message),
    })
  }

  /** A reply, from whichever side the sender is on. */
  async storeMessage({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const participation = await directParticipationFor(user, params.id)
    if (!participation) return this.notFound(response)

    const { body } = await request.validateUsing(bodyValidator)
    const { conversation, role } = participation

    const message = await this.append(conversation, user.id, role, body)
    await notifyNewDirectMessage(conversation, message)

    response.status(201)

    return serialize(ConversationMessageTransformer.transform(message))
  }

  /**
   * Writing a message also stamps the thread: `last_message_at` is what the
   * inbox sorts on, and the sender's own read mark moves with it so their
   * inbox doesn't light up for something they just wrote.
   */
  private async append(
    conversation: Conversation,
    userId: string,
    role: DirectSenderRole,
    body: string
  ) {
    const message = new ConversationMessage()
    message.conversationId = conversation.id
    message.senderUserId = userId
    message.senderRole = role
    message.body = body
    await message.save()

    conversation.lastMessageAt = message.createdAt
    if (role === 'buyer') conversation.buyerReadAt = message.createdAt
    else conversation.sellerReadAt = message.createdAt
    await conversation.save()

    await message.load('sender')

    return message
  }

  private notFound(response: HttpContext['response']) {
    return response.notFound({
      errors: [{ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' }],
    })
  }
}
