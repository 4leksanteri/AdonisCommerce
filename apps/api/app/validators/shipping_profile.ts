import vine from '@vinejs/vine'

export const MAX_RATES_PER_PROFILE = 50

export const shippingProfileValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(60),
  rates: vine
    .array(
      vine.object({
        // A country code, or '*' for everywhere without its own rate
        destination: vine
          .string()
          .trim()
          .regex(/^([A-Za-z]{2}|\*)$/),
        firstItemCents: vine.number().min(0).withoutDecimals(),
        additionalItemCents: vine.number().min(0).withoutDecimals(),
      })
    )
    .minLength(1)
    .maxLength(MAX_RATES_PER_PROFILE),
})
