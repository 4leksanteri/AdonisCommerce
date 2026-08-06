import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Grid-card shape for storefront listings. Deliberately flat: a card needs
 * one image and a price range, not the whole option/variant tree, so this
 * collapses the variants server-side rather than shipping them all down.
 */
export default class PublicProductCardTransformer extends BaseTransformer<Product> {
  toObject() {
    // `seller`, `variants` and `images` must be preloaded before
    // transforming — Lucid won't lazy-load them.
    const prices = this.resource.variants.map((variant) => Number(variant.priceCents))
    const image = this.resource.images.at(0)

    return {
      ...this.pick(this.resource, ['id', 'title', 'slug', 'currency']),
      shop: {
        name: this.resource.seller.shopName,
        slug: this.resource.seller.slug,
      },
      imageUrl: image ? `/uploads/${image.path}` : null,
      priceMinCents: prices.length > 0 ? Math.min(...prices) : null,
      priceMaxCents: prices.length > 0 ? Math.max(...prices) : null,
    }
  }
}
