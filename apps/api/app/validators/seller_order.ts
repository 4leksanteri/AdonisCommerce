import vine from '@vinejs/vine'

export const shipOrderValidator = vine.create({
  /**
   * Optional, and free text. Sellers here post with Posti, Matkahuolto, DHL
   * and sometimes their own bike, so requiring a code would mean inventing
   * one for the deliveries that don't have any.
   */
  trackingNumber: vine.string().trim().maxLength(100).optional(),
})

export const cancelOrderValidator = vine.create({
  // Shown to the buyer alongside the refund, so it is worth asking for.
  reason: vine.string().trim().maxLength(200).optional(),
})
