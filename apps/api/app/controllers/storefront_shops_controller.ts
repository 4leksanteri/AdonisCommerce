import type { HttpContext } from '@adonisjs/core/http'
import Seller from '#models/seller'
import Product from '#models/product'
import Review from '#models/review'
import ReviewTransformer from '#transformers/review_transformer'
import db from '@adonisjs/lucid/services/db'
import PublicShopTransformer from '#transformers/public_shop_transformer'
import PublicProductCardTransformer from '#transformers/public_product_card_transformer'

const PER_PAGE = 24
const RECENT_REVIEWS = 10

/**
 * A shop's front door.
 *
 * Unauthenticated, so the filtering *is* the security boundary: only
 * `approved` shops resolve, and only their `active` products are listed.
 * A pending or rejected shop 404s rather than 403s — a shopper has no
 * business learning it exists.
 */
export default class StorefrontShopsController {
  async show({ params, request, response, serialize }: HttpContext) {
    const shop = await Seller.query()
      .where('slug', params.shopSlug)
      .where('status', 'approved')
      .first()

    if (!shop) {
      return response.notFound({
        errors: [{ code: 'SHOP_NOT_FOUND', message: 'Shop not found.' }],
      })
    }

    const page = Number(request.input('page', 1)) || 1

    /**
     * Summed from the products' own totals rather than counted over `reviews`.
     * Those totals are already maintained incrementally and are integers, so
     * this is exact and stays one cheap row however many reviews a shop
     * accumulates.
     *
     * The shop's rating *is* the aggregate of its items — there is no separate
     * thing to write, which is how Etsy works too.
     */
    const totals = await db
      .from('products')
      .where('seller_id', shop.id)
      .where('status', 'active')
      .sum('rating_sum as sum')
      .sum('rating_count as count')
      .first()

    const ratingCount = Number(totals?.count ?? 0)
    const ratingSum = Number(totals?.sum ?? 0)

    const reviews = await Review.query()
      .where('sellerId', shop.id)
      .preload('user')
      // For the title in the listing and a link back to what was reviewed.
      .preload('product')
      .orderBy('createdAt', 'desc')
      .limit(RECENT_REVIEWS)

    const products = await Product.query()
      .where('sellerId', shop.id)
      .where('status', 'active')
      .preload('seller')
      .preload('variants', (query) => query.orderBy('createdAt'))
      .preload('images', (query) => query.orderBy('position'))
      .orderBy('createdAt', 'desc')
      .paginate(page, PER_PAGE)

    return serialize({
      shop: PublicShopTransformer.transform(shop),
      rating: {
        // Null rather than zero until someone has actually rated something —
        // an empty score reads as a bad one.
        average: ratingCount > 0 ? ratingSum / ratingCount : null,
        count: ratingCount,
      },
      reviews: ReviewTransformer.transform(reviews),
      products: PublicProductCardTransformer.transform(products.all()),
      // Sent flat rather than as paginator metadata, because the page only
      // needs to know whether to offer a "more" control.
      total: products.getMeta().total,
      page: products.getMeta().currentPage,
      lastPage: products.getMeta().lastPage,
    })
  }
}
