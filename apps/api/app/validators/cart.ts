import vine from '@vinejs/vine'

/** Guards against a client asking us to hydrate an unbounded id list. */
export const MAX_CART_LINES = 100

export const hydrateCartValidator = vine.create({
  items: vine
    .array(
      vine.object({
        variantId: vine.string().uuid(),
        quantity: vine.number().min(1).withoutDecimals(),
      })
    )
    .maxLength(MAX_CART_LINES),
})
