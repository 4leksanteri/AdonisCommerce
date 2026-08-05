import vine from '@vinejs/vine'

export const becomeSellerValidator = vine.create({
  shopName: vine.string().trim().minLength(2).maxLength(100),
  description: vine.string().trim().maxLength(2000).optional(),
})
