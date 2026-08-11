import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Keeps `products.rating_count` / `rating_sum` in step with a review being
 * written or changed.
 *
 * Done as an increment rather than a recount so it stays O(1) as a product
 * accumulates reviews, and inside the caller's transaction so the totals can
 * never disagree with the rows they summarise.
 *
 * `delta` is the change in the sum: a new 4-star review is `(+1, +4)`, and
 * editing a 4 down to a 2 is `(0, -2)`.
 */
export async function applyRatingDelta(
  trx: TransactionClientContract,
  productId: string,
  countDelta: number,
  sumDelta: number
): Promise<void> {
  await trx
    .from('products')
    .where('id', productId)
    .update({
      rating_count: trx.raw('rating_count + ?', [countDelta]),
      rating_sum: trx.raw('rating_sum + ?', [sumDelta]),
      updated_at: new Date(),
    })
}

/**
 * Recomputes a product's totals from its reviews.
 *
 * Not used on the write path — that increments — but the incremental version
 * has no way to notice if it ever drifts, and a rating shown on every product
 * card is worth being able to repair. Called by `reviews:recount`.
 */
export async function recountProductRatings(productId?: string): Promise<number> {
  const result = await db.rawQuery(
    `UPDATE products p
        SET rating_count = COALESCE(r.count, 0),
            rating_sum = COALESCE(r.sum, 0),
            updated_at = NOW()
       FROM (SELECT id FROM products ${productId ? 'WHERE id = :productId' : ''}) AS target
       LEFT JOIN LATERAL (
              SELECT COUNT(*) AS count, SUM(rating) AS sum
                FROM reviews
               WHERE reviews.product_id = target.id
            ) AS r ON TRUE
      WHERE p.id = target.id
        AND (p.rating_count, p.rating_sum) IS DISTINCT FROM (COALESCE(r.count, 0), COALESCE(r.sum, 0))
    RETURNING p.id`,
    productId ? { productId } : {}
  )

  return result.rowCount ?? result.rows.length
}
