import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import PublicProductTransformer from '#transformers/public_product_transformer'
import PublicProductCardTransformer from '#transformers/public_product_card_transformer'
import { toLocale } from '#services/translations'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

export default class StorefrontProductsController {
  /**
   * Newest active products across every approved shop — what the homepage
   * grid renders. Capped rather than paginated for now; a real browse page
   * with paging is a separate job.
   */
  async index({ request, serialize }: HttpContext) {
    const requested = Number(request.input('limit'))
    const limit =
      Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT

    const products = await Product.query()
      .where('status', 'active')
      .whereHas('seller', (query) => query.where('status', 'approved'))
      .preload('seller')
      .preload('variants', (query) => query.orderBy('createdAt'))
      .preload('images', (query) => query.orderBy('position'))
      .orderBy('createdAt', 'desc')
      .limit(limit)

    return serialize(PublicProductCardTransformer.transform(products))
  }

  /**
   * Public product page data, resolved by shop slug + product slug. Unlike
   * the seller-facing `ProductsController`, this is unauthenticated, so the
   * filtering is the security boundary: only `active` products belonging to
   * an `approved` shop are visible. Drafts, archived products and products
   * from a suspended shop all 404 rather than 403 — a shopper has no
   * business learning that they exist.
   */
  async show({ params, request, response, serialize }: HttpContext) {
    const product = await Product.query()
      .where('slug', params.productSlug)
      .where('status', 'active')
      .whereHas('seller', (query) =>
        query.where('slug', params.shopSlug).where('status', 'approved')
      )
      .preload('seller')
      .preload('options', (query) =>
        query.orderBy('position').preload('values', (values) => values.orderBy('position'))
      )
      .preload('variants', (query) => query.orderBy('createdAt').preload('optionValues'))
      .preload('images', (query) => query.orderBy('position'))
      .preload('shippingProfile', (profile) => profile.preload('rates'))
      .preload('category', (category) => category.preload('translations'))
      // Capped: a product page shows recent opinions, not an archive. The
      // count and average come from the product's own totals, so nothing here
      // depends on having loaded them all.
      .preload('reviews', (query) => query.orderBy('createdAt', 'desc').limit(20).preload('user'))
      .first()

    if (!product) {
      return response.notFound({
        errors: [{ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' }],
      })
    }

    // The category is the one thing on this page that has to be translated
    // from data rather than from the language files.
    return serialize(PublicProductTransformer.transform(product, toLocale(request.input('locale'))))
  }
}
