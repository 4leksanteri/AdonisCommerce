import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import OrderItem from '#models/order_item'
import ProductVariant from '#models/product_variant'
import Review from '#models/review'
import ReviewTransformer from '#transformers/review_transformer'
import { createReviewValidator, updateReviewValidator } from '#validators/review'
import { applyRatingDelta } from '#services/reviews'

/**
 * Reviews are written against a line of a completed order, which is what
 * makes every one of them a verified purchase.
 *
 * Gated on `completed` rather than `paid`: the whole point is an opinion of
 * the thing in your hands, and an order only completes when the buyer says it
 * arrived or the delivery window closes.
 */
export default class ReviewsController {
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { orderItemId, rating, body } = await request.validateUsing(createReviewValidator)

    const item = await OrderItem.query().where('id', orderItemId).preload('order').first()

    // Someone else's purchase is a 404, not a 403 — there is no reason to
    // confirm that an order item id exists.
    if (!item || item.order.userId !== user.id) {
      return response.notFound({
        errors: [{ code: 'ORDER_ITEM_NOT_FOUND', message: 'Item not found.' }],
      })
    }

    if (item.order.status !== 'completed') {
      return response.conflict({
        errors: [
          { code: 'REVIEW_ORDER_NOT_COMPLETE', message: 'You can review this once it arrives.' },
        ],
      })
    }

    /**
     * Order items only keep a soft pointer to the variant, so the product has
     * to be resolved now and pinned on the review. If the variant is gone
     * there is nothing to attach the review to.
     */
    const variant = item.productVariantId
      ? await ProductVariant.query().where('id', item.productVariantId).preload('product').first()
      : null

    if (!variant) {
      return response.conflict({
        errors: [
          {
            code: 'REVIEW_PRODUCT_UNAVAILABLE',
            message: 'This product can no longer be reviewed.',
          },
        ],
      })
    }

    // The unique index on order_item_id is the real guard; this only turns a
    // double submit into a readable message instead of a constraint error.
    const existing = await Review.query().where('orderItemId', orderItemId).first()
    if (existing) {
      return response.conflict({
        errors: [{ code: 'REVIEW_ALREADY_WRITTEN', message: 'You have already reviewed this.' }],
      })
    }

    const review = await db.transaction(async (trx) => {
      const created = new Review()
      created.useTransaction(trx)
      created.orderItemId = orderItemId
      created.productId = variant.product.id
      created.sellerId = variant.product.sellerId
      created.userId = user.id
      // Copied from the order item, which is itself a snapshot taken at
      // purchase — so the review keeps its subject even if the product is
      // renamed, archived or the order is ever purged.
      created.productTitle = item.productTitle
      created.variantLabel = item.variantLabel
      created.rating = rating
      created.body = body ?? null
      await created.save()

      await applyRatingDelta(trx, variant.product.id, 1, rating)

      return created
    })

    await review.load('user')
    response.status(201)

    return serialize(ReviewTransformer.transform(review))
  }

  /**
   * Editable, because a first impression a week in is often worth revising
   * and the alternative is people writing a second review they can't.
   */
  async update({ params, request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { rating, body } = await request.validateUsing(updateReviewValidator)

    const review = await Review.query().where('id', params.id).where('userId', user.id).first()

    if (!review) {
      return response.notFound({
        errors: [{ code: 'REVIEW_NOT_FOUND', message: 'Review not found.' }],
      })
    }

    const previousRating = review.rating

    await db.transaction(async (trx) => {
      review.useTransaction(trx)
      review.rating = rating
      review.body = body ?? null
      await review.save()

      // Count is unchanged; only the sum moves by the difference.
      if (rating !== previousRating) {
        await applyRatingDelta(trx, review.productId, 0, rating - previousRating)
      }
    })

    await review.load('user')

    return serialize(ReviewTransformer.transform(review))
  }
}
