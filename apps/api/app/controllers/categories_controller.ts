import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import CategoryTransformer from '#transformers/category_transformer'
import { toLocale } from '#services/translations'

/**
 * The taxonomy, in the caller's language.
 *
 * Unauthenticated: it is the same curated list for everyone, the seller form
 * needs it, and the storefront will when browse arrives.
 */
export default class CategoriesController {
  async index({ request, serialize }: HttpContext) {
    const locale = toLocale(request.input('locale'))

    const categories = await Category.query()
      .where('isActive', true)
      .preload('translations')
      .orderBy('position')

    return serialize(CategoryTransformer.transform(categories, locale))
  }

  /**
   * One category, found by its slug in **any** language and answered in the
   * caller's.
   *
   * Both halves of that matter. Category slugs are translated, so switching
   * language on `/fi/kategoria/koti-ja-sisustus` hands the English route a
   * Finnish slug — next-intl translates the path pattern, not the values in
   * it. Matching across locales lets that resolve; answering with this
   * locale's slug is what lets the page redirect to the canonical one rather
   * than serving the same listing at two URLs.
   */
  async show({ params, request, response, serialize }: HttpContext) {
    const locale = toLocale(request.input('locale'))

    const category = await Category.query()
      .where('isActive', true)
      .whereHas('translations', (translations) => translations.where('slug', params.slug))
      .preload('translations')
      .first()

    if (!category) {
      return response.notFound({
        errors: [{ code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' }],
      })
    }

    return serialize(CategoryTransformer.transform(category, locale))
  }
}
