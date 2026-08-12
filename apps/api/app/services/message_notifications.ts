import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import TransactionalNotification from '#mails/transactional_notification'
import User from '#models/user'
import type Conversation from '#models/conversation'
import type ConversationMessage from '#models/conversation_message'
import type { DirectSenderRole } from '#models/conversation_message'
import { toLocale } from '#services/translations'
import { conversationUrl } from '#services/frontend_routes'
import { isPresentInConversation } from '#services/direct_messages'

const EXCERPT_LENGTH = 140

/**
 * Tells the other side that something arrived.
 *
 * Without this the whole feature is inert: nobody sits on an inbox they have
 * no reason to open, and a maker who misses a question about a commission
 * loses the sale. There is no unread badge yet, so this is the only signal.
 */
export async function notifyNewDirectMessage(
  conversation: Conversation,
  message: ConversationMessage
) {
  const recipientRole: DirectSenderRole = message.senderRole === 'buyer' ? 'seller' : 'buyer'

  const recipient =
    recipientRole === 'buyer'
      ? (conversation.buyer ?? (await User.find(conversation.buyerUserId)))
      : await User.find(conversation.seller.userId)

  if (!recipient) return

  // Someone who wrote here a moment ago is plainly still reading; emailing
  // them about the reply they are watching arrive is just noise.
  if (await isPresentInConversation(conversation.id, recipient.id)) return

  const locale = toLocale(recipient.locale)
  const senderName =
    message.senderRole === 'buyer'
      ? (message.sender?.fullName?.trim().split(/\s+/)[0] ?? '')
      : conversation.seller.shopName

  try {
    await mail.sendLater(
      new TransactionalNotification({
        to: recipient.email,
        locale,
        template: 'directMessage',
        params: {
          sender: senderName,
          // Trimmed rather than sent whole: an email is a nudge to come and
          // read, and a full copy invites replying to a mailbox nobody reads.
          excerpt:
            message.body.length > EXCERPT_LENGTH
              ? `${message.body.slice(0, EXCERPT_LENGTH)}…`
              : message.body,
        },
        action: {
          url: conversationUrl(locale, recipientRole, conversation.id),
          labelKey: 'viewMessage',
        },
      })
    )
  } catch (error) {
    // A mail failure must never take down the thing that triggered it — the
    // message is already saved, and losing it to a bad Redis day would be
    // considerably worse than a missed email.
    logger.error({ err: error, to: recipient.email }, 'Could not queue a message email')
  }
}
