import type Product from '#models/product'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductOptionTransformer from '#transformers/product_option_transformer'
import PublicProductVariantTransformer from '#transformers/public_product_variant_transformer'
import ProductImageTransformer from '#transformers/product_image_transformer'
import ShippingRateTransformer from '#transformers/shipping_rate_transformer'
import ReviewTransformer from '#transformers/review_transformer'

/**
 * Storefront-facing product. Drops `status` (public products are always
 * active, so it carries no information) and routes variants through the
 * public transformer so SKUs stay internal.
 */
export default class PublicProductTransformer extends BaseTransformer<Product> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'title',
        'slug',
        'description',
        'currency',
        'tracksInventory',
        'createdAt',
      ]),
      // `seller`, `options`, `variants` and `images` must all be preloaded
      // before transforming — Lucid won't lazy-load them.
      shop: {
        name: this.resource.seller.shopName,
        slug: this.resource.seller.slug,
      },
      // `.depth(2)` is required on options — `BaseTransformer.transform()`
      // bakes in a default maxDepth of 1, which would silently drop the
      // nested `values`. Same for the variants' `optionValues`.
      // Sum and count are what's stored; the average is derived, so a
      // product with no reviews reads as null rather than a misleading zero.
      rating: {
        average: this.resource.ratingAverage,
        count: this.resource.ratingCount,
      },
      // Preloaded newest-first by the storefront controller.
      reviews: ReviewTransformer.transform(this.whenLoaded(this.resource.reviews)),
      options: ProductOptionTransformer.transform(this.resource.options).depth(2),
      variants: PublicProductVariantTransformer.transform(this.resource.variants).depth(2),
      images: ProductImageTransformer.transform(this.resource.images),
      /**
       * The whole rate table, not a single computed cost. What a shopper pays
       * depends on where they are and how many they buy, and shipping the
       * rates lets the page answer both without a round-trip per change.
       * They're public information anyway — Etsy prints them on the listing.
       */
      shippingRates: this.resource.shippingProfile
        ? ShippingRateTransformer.transform(this.resource.shippingProfile.rates)
        : [],
    }
  }
}
