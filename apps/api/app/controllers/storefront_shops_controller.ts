import type { HttpContext } from '@adonisjs/core/http'
import Seller from '#models/seller'
import Product from '#models/product'
import PublicShopTransformer from '#transformers/public_shop_transformer'
import PublicProductCardTransformer from '#transformers/public_product_card_transformer'

const PER_PAGE = 24

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
      products: PublicProductCardTransformer.transform(products.all()),
      // Sent flat rather than as paginator metadata, because the page only
      // needs to know whether to offer a "more" control.
      total: products.getMeta().total,
      page: products.getMeta().currentPage,
      lastPage: products.getMeta().lastPage,
    })
  }
}
