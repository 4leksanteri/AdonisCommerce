import type Review from '#models/review'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ReviewModel from '#models/review'

export default class ReviewTransformer extends BaseTransformer<Review> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'rating',
        'body',
        'createdAt',
        'updatedAt',
        // Snapshotted at write time so a review can still say what it was
        // about even if the catalogue moves on.
        'productTitle',
        'variantLabel',
      ]),
      /**
       * The snapshotted title with a *live* slug — same split as orders. The
       * title is what the buyer reviewed and must not change under them; the
       * slug is only a route, and renaming a product leaves it alone.
       * Null on surfaces that don't preload the product, like a product's own
       * page, where linking back to itself would be pointless.
       */
      productSlug: this.resource.product?.slug ?? null,
      // Never the full name — reviews are public and permanent, and nobody
      // agreed to that when they bought a tea towel. Null once an account has
      // been erased; the UI supplies the wording for that.
      author: ReviewModel.displayName(this.resource.user?.fullName),
    }
  }
}
