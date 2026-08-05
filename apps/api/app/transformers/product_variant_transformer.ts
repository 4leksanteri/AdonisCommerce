import type ProductVariant from '#models/product_variant'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionValueTransformer from '#transformers/product_option_value_transformer'

export default class ProductVariantTransformer extends BaseTransformer<ProductVariant> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'sku', 'price', 'stockQuantity', 'createdAt']),
      // `optionValues` must be preloaded via `.preload('optionValues')` before
      // transforming — Lucid won't lazy-load it.
      optionValues: ProductOptionValueTransformer.transform(this.resource.optionValues),
    }
  }
}
