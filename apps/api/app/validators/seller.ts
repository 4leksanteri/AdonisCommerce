import vine from '@vinejs/vine'
import { SUPPORTED_CURRENCIES } from '#services/currencies'

export const becomeSellerValidator = vine.create({
  shopName: vine.string().trim().minLength(2).maxLength(100),
  description: vine.string().trim().maxLength(2000).optional(),
  // The currency new products inherit. Changing it never touches products
  // already priced — those carry their own currency.
  currency: vine.enum(SUPPORTED_CURRENCIES).optional(),
})
