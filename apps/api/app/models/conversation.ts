import { ConversationSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Seller from '#models/seller'
import ConversationMessage from '#models/conversation_message'
import type { DirectSenderRole } from '#models/conversation_message'

export default class Conversation extends ConversationSchema {
  @belongsTo(() => User, { foreignKey: 'buyerUserId' })
  declare buyer: BelongsTo<typeof User>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => ConversationMessage)
  declare messages: HasMany<typeof ConversationMessage>

  /** The last message, when preloaded for an inbox listing. */
  @hasMany(() => ConversationMessage)
  declare latestMessage: HasMany<typeof ConversationMessage>

  readAtFor(role: DirectSenderRole): DateTime | null {
    return role === 'buyer' ? this.buyerReadAt : this.sellerReadAt
  }

  /**
   * Whether this side has something waiting. Not simply "newer than my last
   * look": my own message is newer than my last look the instant I send it,
   * and an inbox that marks itself unread when you reply is a bug people
   * describe as the app being broken.
   */
  isUnreadFor(role: DirectSenderRole, lastSenderRole: DirectSenderRole | null): boolean {
    if (!this.lastMessageAt || lastSenderRole === role) return false

    const readAt = this.readAtFor(role)
    return readAt === null || readAt < this.lastMessageAt
  }
}
