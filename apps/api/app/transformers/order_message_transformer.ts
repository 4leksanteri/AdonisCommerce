import type Message from '#models/order_message'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrderMessageTransformer extends BaseTransformer<Message> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'senderRole', 'body', 'createdAt']),
      /**
       * First name only. The two sides of an order already know each other's
       * full name from the address, but a conversation is read at a glance
       * and a surname adds nothing; staff appear by role, not by name, so a
       * decision reads as the platform's rather than one person's.
       */
      senderName:
        this.resource.senderRole === 'staff'
          ? null
          : (this.resource.sender?.fullName?.trim().split(/\s+/)[0] ?? null),
    }
  }
}
