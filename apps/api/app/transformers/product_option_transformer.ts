import type ProductOption from '#models/product_option'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionValueTransformer from '#transformers/product_option_value_transformer'

export default class ProductOptionTransformer extends BaseTransformer<ProductOption> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'position']),
      // `values` must be preloaded via `.preload('values')` before
      // transforming — Lucid won't lazy-load it.
      values: ProductOptionValueTransformer.transform(this.resource.values),
    }
  }
}
