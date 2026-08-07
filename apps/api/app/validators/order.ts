import vine from '@vinejs/vine'
import { MAX_CART_LINES } from '#validators/cart'

export const createOrderValidator = vine.create({
  items: vine
    .array(
      vine.object({
        variantId: vine.string().uuid(),
        quantity: vine.number().min(1).withoutDecimals(),
      })
    )
    .minLength(1)
    .maxLength(MAX_CART_LINES),
  shipping: vine.object({
    name: vine.string().trim().minLength(1).maxLength(150),
    line1: vine.string().trim().minLength(1).maxLength(200),
    line2: vine.string().trim().maxLength(200).optional(),
    city: vine.string().trim().minLength(1).maxLength(100),
    postalCode: vine.string().trim().minLength(1).maxLength(20),
    // ISO 3166-1 alpha-2, uppercased by the client
    country: vine.string().trim().fixedLength(2),
  }),
})
