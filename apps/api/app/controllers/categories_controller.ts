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
}
