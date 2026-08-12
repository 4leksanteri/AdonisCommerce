import type ConversationMessage from '#models/conversation_message'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ConversationMessageTransformer extends BaseTransformer<ConversationMessage> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'senderRole', 'body', 'createdAt']),
      /**
       * First name only, as in order threads — except that here the two
       * sides may never have exchanged an address, so this is all the buyer
       * is identified by. Null once an account has been anonymised.
       */
      senderName: this.resource.sender?.fullName?.trim().split(/\s+/)[0] ?? null,
    }
  }
}
