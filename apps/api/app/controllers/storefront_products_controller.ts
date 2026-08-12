import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import PublicProductTransformer from '#transformers/public_product_transformer'
import PublicProductCardTransformer from '#transformers/public_product_card_transformer'
import { toLocale } from '#services/translations'
import { getExchangeRates } from '#services/exchange_rates'

const PER_PAGE = 24

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'rating'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

/**
 * The cheapest variant of a product, as a scalar subquery.
 *
 * Price lives on variants, not products, so every price-shaped question
 * about a listing has to go through one of these. Correlated rather than
 * joined + grouped, which would multiply the rows before the paginator
 * counts them.
 */
const MIN_PRICE = '(select min(price_cents) from product_variants where product_id = products.id)'

export default class StorefrontProductsController {
  /**
   * Browse and search, in one endpoint: the homepage grid is this with no
   * filters, and a category page is this with one.
   */
  async index({ request, serialize }: HttpContext) {
    const search = String(request.input('q', '')).trim()
    const categorySlug = String(request.input('category', '')).trim()
    const sort = this.sortFrom(request.input('sort'))
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    const category = categorySlug ? await this.findCategory(categorySlug) : null
    // A slug that resolves to nothing must not quietly widen to everything —
    // that would answer "we have none of those" with the whole catalogue.
    if (categorySlug && !category) {
      return serialize({ products: [], total: 0, page: 1, lastPage: 1 })
    }

    const query = Product.query()
      .where('status', 'active')
      .whereHas('seller', (sellers) => sellers.where('status', 'approved'))
      .if(category, (products) => products.where('categoryId', category!.id))
      .if(search !== '', (products) =>
        products.where((match) =>
          match
            .whereILike('title', `%${search}%`)
            // The shop's name too: "search" on a marketplace means "find me
            // that maker", not only "find me that noun".
            .orWhereHas('seller', (sellers) => sellers.whereILike('shopName', `%${search}%`))
        )
      )
      .preload('seller')
      .preload('variants', (variants) => variants.orderBy('createdAt'))
      .preload('images', (images) => images.orderBy('position'))

    await this.applySort(query, sort)

    const products = await query.paginate(page, PER_PAGE)
    const meta = products.getMeta()

    // Shaped like the shop page's listing block, since it is the same block:
    // a page of cards plus what the pager needs to know.
    return serialize({
      products: PublicProductCardTransformer.transform(products.all()),
      total: meta.total,
      page: meta.currentPage,
      lastPage: meta.lastPage,
    })
  }

  private sortFrom(value: unknown): ProductSort {
    return PRODUCT_SORTS.includes(value as ProductSort) ? (value as ProductSort) : 'newest'
  }

  /**
   * Resolved from a slug in **any** language, not just the one being browsed
   * in. Category slugs are translated, so switching language on a category
   * page carries the old language's slug across — the caller compares what it
   * asked for against the canonical slug and redirects.
   */
  private findCategory(slug: string) {
    return Category.query()
      .where('isActive', true)
      .whereHas('translations', (translations) => translations.where('slug', slug))
      .preload('translations')
      .first()
  }

  private async applySort(query: ReturnType<typeof Product.query>, sort: ProductSort) {
    if (sort === 'rating') {
      // Unrated last: no opinions is not the same as bad ones, and floating
      // a blank product above a four-star one reads as a bug.
      query
        .orderByRaw('(rating_sum::float / nullif(rating_count, 0)) desc nulls last')
        .orderBy('createdAt', 'desc')
      return
    }

    if (sort === 'price_asc' || sort === 'price_desc') {
      const direction = sort === 'price_asc' ? 'asc' : 'desc'
      // Interpolated rather than bound: every part of it is a currency code
      // from our own allow-list or a number we computed. No caller input
      // reaches this string.
      const inEur = await this.priceInEurExpression()
      query.orderByRaw(`${MIN_PRICE} * ${inEur} ${direction} nulls last`)
      query.orderBy('createdAt', 'desc')
      return
    }

    query.orderBy('createdAt', 'desc')
  }

  /**
   * A multiplier that brings every listing onto one currency before they are
   * compared. Sorting raw minor units would rank a 299,00 kr scarf below a
   * €30 one, because 29900 > 3000 says nothing across currencies.
   *
   * Built from today's ECB rates and inlined into the query rather than
   * denormalised onto the row: no column to keep in step with a rate that
   * moves daily, and no re-normalising job. It does mean the sort can't use
   * an index, which is the trade to revisit when the catalogue is large
   * enough for that to show.
   */
  private async priceInEurExpression() {
    const rates = await getExchangeRates()
    const cases = Object.entries(rates)
      // Rates are quoted per 1 EUR, so converting *to* EUR divides by them.
      .map(([code, rate]) => `when '${code}' then ${1 / rate}`)
      .join(' ')

    // A currency the ECB didn't return is left at face value — wrong, but
    // only for as long as that feed is down, and only for its own listings.
    return `(case products.currency ${cases} else 1 end)`
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
