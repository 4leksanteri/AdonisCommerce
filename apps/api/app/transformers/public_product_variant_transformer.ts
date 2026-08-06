import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionValueTransformer from '#transformers/product_option_value_transformer'

/**
 * Storefront-facing variant. Deliberately narrower than
 * `ProductVariantTransformer` — `sku` is the seller's own inventory
 * reference and has no business reaching shoppers.
 */
export default class PublicProductVariantTransformer extends BaseTransformer<ProductVariant> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'stockQuantity']),
      priceCents: Number(this.resource.priceCents),
      // `optionValues` must be preloaded via `.preload('optionValues')` before
      // transforming — Lucid won't lazy-load it.
      optionValues: ProductOptionValueTransformer.transform(this.resource.optionValues),
    }
  }
}
