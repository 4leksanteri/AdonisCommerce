import vine from '@vinejs/vine'
import { SUPPORTED_LOCALES } from '#services/translations'

/**
 * Every locale must be supplied. A category missing a translation renders as
 * a gap on a product page, and the admin screen is the only thing that could
 * have caught it.
 */
export const categoryValidator = vine.create({
  position: vine.number().min(0).withoutDecimals().optional(),
  isActive: vine.boolean().optional(),
  translations: vine
    .array(
      vine.object({
        locale: vine.enum(SUPPORTED_LOCALES),
        name: vine.string().trim().minLength(1).maxLength(100),
        // Derived from the name when left out, which is the usual case.
        slug: vine.string().trim().maxLength(120).optional(),
      })
    )
    .minLength(SUPPORTED_LOCALES.length),
})
