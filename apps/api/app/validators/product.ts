import vine from '@vinejs/vine'

export const createProductValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(150),
  description: vine.string().trim().maxLength(5000).optional(),
  // Only the seller-settable states — `draft` is assigned server-side by
  // `storeDraft` and left behind the moment the product is first saved.
  status: vine.enum(['active', 'archived']).optional(),
  options: vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(60),
        values: vine.array(vine.string().trim().minLength(1).maxLength(60)).minLength(1),
      })
    )
    .optional(),
  // Every product needs at least one variant — a product with no options
  // still gets a single variant carrying its price/stock.
  variants: vine
    .array(
      vine.object({
        // Positionally aligned with the top-level `options` array — e.g.
        // optionValues[0] is the value for options[0].
        optionValues: vine.array(vine.string().trim()).optional(),
        sku: vine.string().trim().maxLength(60).optional(),
        price: vine.number().min(0),
        stockQuantity: vine.number().min(0),
      })
    )
    .minLength(1),
})
