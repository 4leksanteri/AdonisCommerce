import vine from '@vinejs/vine'
import { SUPPORTED_CURRENCIES } from '#services/currencies'

/**
 * Caps on the option/variant tree. Variants are the cartesian product of the
 * options, so without a ceiling three options of ten values each is already
 * a thousand rows in one request — enough to wedge the seller form and bloat
 * the database by accident. Shopify holds a comparable line at three options.
 */
export const MAX_OPTIONS = 3
export const MAX_VALUES_PER_OPTION = 50
export const MAX_VARIANTS = 200

export const createProductValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(150),
  description: vine.string().trim().maxLength(5000).optional(),
  // Set from the seller's shop currency when omitted. Recorded per product so
  // a shop changing its currency can't reinterpret existing prices.
  currency: vine.enum(SUPPORTED_CURRENCIES).optional(),
  // False for made-to-order and digital listings, where `stockQuantity` is
  // kept but ignored rather than repurposed as a sentinel.
  tracksInventory: vine.boolean().optional(),
  // Null ships this product free; the form preselects one when the shop has any.
  shippingProfileId: vine.string().uuid().nullable().optional(),
  // Only the seller-settable states — `draft` is assigned server-side by
  // `storeDraft` and left behind the moment the product is first saved.
  status: vine.enum(['active', 'archived']).optional(),
  options: vine
    .array(
      vine.object({
        name: vine.string().trim().minLength(1).maxLength(60),
        values: vine
          .array(vine.string().trim().minLength(1).maxLength(60))
          .minLength(1)
          .maxLength(MAX_VALUES_PER_OPTION),
      })
    )
    .maxLength(MAX_OPTIONS)
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
        // Minor units (1250 = €12.50). Integer-only: money must never arrive
        // as a float, and the number of decimals is a property of the
        // currency, not of the amount.
        priceCents: vine.number().min(0).withoutDecimals(),
        stockQuantity: vine.number().min(0).withoutDecimals(),
      })
    )
    .minLength(1)
    .maxLength(MAX_VARIANTS),
})
