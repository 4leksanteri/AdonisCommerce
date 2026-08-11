import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import OrderMessage from '#models/order_message'
import OrderMessageTransformer from '#transformers/order_message_transformer'
import { participationFor } from '#services/conversations'
import { notifyNewMessage } from '#services/order_notifications'

const sendValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(4000),
})

/**
 * One conversation per order, reached by all three roles through the same
 * endpoint.
 *
 * Deliberately not split into buyer/seller/staff variants under their
 * existing prefixes: that would be three copies of the same authorization
 * question, and the copy that drifts is the one that leaks someone's
 * conversation.
 */
export default class OrderMessagesController {
  async index({ params, auth, response, serialize }: HttpContext) {
    const participation = await participationFor(auth.getUserOrFail(), params.orderId)
    if (!participation) return this.notFound(response)

    const messages = await OrderMessage.query()
      .where('orderId', participation.order.id)
      .preload('sender')
      .orderBy('createdAt', 'asc')

    return serialize({
      messages: OrderMessageTransformer.transform(messages),
      // The client needs to know whether to render a composer, and the rule
      // belongs here rather than being re-derived from role and status.
      canPost: participation.canPost,
      role: participation.role,
    })
  }

  async store({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const participation = await participationFor(user, params.orderId)
    if (!participation) return this.notFound(response)

    if (!participation.canPost) {
      return response.forbidden({
        errors: [
          { code: 'CONVERSATION_READ_ONLY', message: 'You cannot post in this conversation.' },
        ],
      })
    }

    const { body } = await request.validateUsing(sendValidator)

    const message = new OrderMessage()
    message.orderId = participation.order.id
    message.senderUserId = user.id
    message.senderRole = participation.role
    message.body = body
    await message.save()

    await message.load('sender')
    await notifyNewMessage(participation.order, message)

    response.status(201)

    return serialize(OrderMessageTransformer.transform(message))
  }

  private notFound(response: HttpContext['response']) {
    return response.notFound({
      errors: [{ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' }],
    })
  }
}
