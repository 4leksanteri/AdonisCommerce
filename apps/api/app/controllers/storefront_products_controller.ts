import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import PublicProductTransformer from '#transformers/public_product_transformer'
import PublicProductCardTransformer from '#transformers/public_product_card_transformer'

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
      .preload('variants')
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
  async show({ params, response, serialize }: HttpContext) {
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
      .preload('variants', (query) => query.preload('optionValues'))
      .preload('images', (query) => query.orderBy('position'))
      .first()

    if (!product) {
      return response.notFound({
        errors: [{ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' }],
      })
    }

    return serialize(PublicProductTransformer.transform(product))
  }
}
