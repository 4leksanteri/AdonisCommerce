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
      // Never the full name — reviews are public and permanent, and nobody
      // agreed to that when they bought a tea towel. Null once an account has
      // been erased; the UI supplies the wording for that.
      author: ReviewModel.displayName(this.resource.user?.fullName),
    }
  }
}
