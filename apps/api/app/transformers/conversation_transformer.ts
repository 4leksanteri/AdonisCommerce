import type Conversation from '#models/conversation'
import { BaseTransformer } from '@adonisjs/core/transformers'
import type { DirectSenderRole } from '#models/conversation_message'

const EXCERPT_LENGTH = 120

/**
 * One line of an inbox, told from the reader's side: the "other party" is
 * the shop when a buyer is reading and the person when a seller is.
 *
 * The viewer's role is a constructor argument rather than something the
 * transformer works out, because the same row is two different lines
 * depending on who opened the page.
 */
export default class ConversationTransformer extends BaseTransformer<Conversation> {
  constructor(
    conversation: Conversation,
    private viewerRole: DirectSenderRole
  ) {
    super(conversation)
  }

  toObject() {
    // `messages` is preloaded with just the newest one — see the controller.
    const last = this.resource.messages?.at(0)
    const lastSenderRole = (last?.senderRole ?? null) as DirectSenderRole | null

    return {
      id: this.resource.id,
      /** Who the reader is talking to. A shop has a face; a shopper has a name. */
      with:
        this.viewerRole === 'buyer'
          ? {
              name: this.resource.seller.shopName,
              slug: this.resource.seller.slug,
              avatarUrl: this.resource.seller.avatarPath
                ? `/uploads/${this.resource.seller.avatarPath}`
                : null,
            }
          : {
              name: this.resource.buyer?.fullName?.trim() ?? null,
              slug: null,
              avatarUrl: null,
            },
      lastMessageAt: this.resource.lastMessageAt,
      excerpt: last
        ? last.body.length > EXCERPT_LENGTH
          ? `${last.body.slice(0, EXCERPT_LENGTH)}…`
          : last.body
        : null,
      /** So the inbox can show whose turn it is without loading the thread. */
      lastSenderRole,
      isUnread: this.resource.isUnreadFor(this.viewerRole, lastSenderRole),
    }
  }
}
