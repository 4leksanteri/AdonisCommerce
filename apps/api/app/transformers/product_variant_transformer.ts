import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionValueTransformer from '#transformers/product_option_value_transformer'

export default class ProductVariantTransformer extends BaseTransformer<ProductVariant> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'sku', 'stockQuantity', 'createdAt']),
      // Postgres returns bigint as a string to protect precision it doesn't
      // know we don't need. Cents fit in a safe integer, so normalise to a
      // number here rather than leaving clients to guess the type.
      priceCents: Number(this.resource.priceCents),
      // `optionValues` must be preloaded via `.preload('optionValues')` before
      // transforming — Lucid won't lazy-load it.
      optionValues: ProductOptionValueTransformer.transform(this.resource.optionValues),
    }
  }
}
