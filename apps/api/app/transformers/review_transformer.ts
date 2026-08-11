import type Review from '#models/review'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ReviewModel from '#models/review'

export default class ReviewTransformer extends BaseTransformer<Review> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'rating', 'body', 'createdAt', 'updatedAt']),
      // Never the full name — reviews are public and permanent, and nobody
      // agreed to that when they bought a tea towel.
      author: ReviewModel.displayName(this.resource.user?.fullName ?? null),
    }
  }
}
