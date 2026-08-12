import { ConversationMessageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Conversation from '#models/conversation'

/**
 * No `staff` here, unlike an order thread. Nobody arbitrates a private
 * conversation, so there is no third role to be.
 */
export const DIRECT_SENDER_ROLES = ['buyer', 'seller'] as const
export type DirectSenderRole = (typeof DIRECT_SENDER_ROLES)[number]

export default class ConversationMessage extends ConversationMessageSchema {
  @belongsTo(() => Conversation)
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => User, { foreignKey: 'senderUserId' })
  declare sender: BelongsTo<typeof User>
}
