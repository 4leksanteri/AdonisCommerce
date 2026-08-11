import vine from '@vinejs/vine'
import { SUPPORTED_CURRENCIES } from '#services/currencies'

/**
 * Caps on the option/variant tree. Variants are the cartesian product of the
 * options, so without a ceiling three options of ten values each is already
 * a thousand rows in one request — enough to wedge the seller form and bloat
 * the database by accident. Shopify holds a comparable line at three options.
 */
/**
 * Etsy's limit, and a real constraint rather than an arbitrary one: past ten,
 * further angles of a handmade object stop adding information and start
 * costing storage and page weight. It also keeps the gallery a size the page
 * can lay out — an uncapped thumbnail strip pushes everything that matters
 * below the fold on a phone.
 */
export const MAX_IMAGES = 10

/**
 * Longest edge of a stored product photo.
 *
 * The biggest a product image is ever rendered is the 800px main frame on the
 * product page, so 1600 covers it on a 2x display with nothing to spare.
 * Storing what came off the phone instead — often 4000px — costs disk and
 * ships megabytes to anyone on a phone, for pixels no screen will show.
 */
export const MAX_IMAGE_DIMENSION = 1600

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
  /**
   * Required, even though the column is nullable for the products that
   * predate it. The point of capturing this before browse exists is to have
   * it when browse arrives, and an optional field on a seller form is a field
   * that gets skipped.
   */
  categoryId: vine.string().uuid(),
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
