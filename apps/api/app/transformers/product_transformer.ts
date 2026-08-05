import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionTransformer from '#transformers/product_option_transformer'
import ProductVariantTransformer from '#transformers/product_variant_transformer'

export default class ProductTransformer extends BaseTransformer<Product> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'slug', 'description', 'status', 'createdAt']),
      // `options` and `variants` must be preloaded before transforming —
      // Lucid won't lazy-load them.
      // `.depth(2)` is required here — `BaseTransformer.transform()` bakes in
      // a default maxDepth of 1, which would silently drop the second level
      // of nesting (values/optionValues) during resolution.
      options: ProductOptionTransformer.transform(this.resource.options).depth(2),
      variants: ProductVariantTransformer.transform(this.resource.variants).depth(2),
    }
  }
}
