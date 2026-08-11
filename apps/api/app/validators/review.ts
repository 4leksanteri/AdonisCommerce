import vine from '@vinejs/vine'
import { MAX_RATING, MIN_RATING } from '#models/review'

export const createReviewValidator = vine.create({
  orderItemId: vine.string().uuid(),
  rating: vine.number().min(MIN_RATING).max(MAX_RATING).withoutDecimals(),
  // Optional: a rating on its own is still a useful signal, and demanding
  // prose is how you end up with "good" typed a thousand times.
  body: vine.string().trim().maxLength(2000).optional(),
})

export const updateReviewValidator = vine.create({
  rating: vine.number().min(MIN_RATING).max(MAX_RATING).withoutDecimals(),
  body: vine.string().trim().maxLength(2000).optional(),
})
