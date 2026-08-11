import type Category from '#models/category'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Every translation at once, unlike the public transformer which resolves one
 * — the admin screen edits them side by side, and seeing them together is how
 * you notice one has drifted from the other.
 */
export default class AdminCategoryTransformer extends BaseTransformer<Category> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'position', 'isActive']),
      // Absent unless `withCount` ran; shown so nobody retires a category
      // with a hundred listings under it by accident.
      productCount: Number(this.resource.$extras.products_count ?? 0),
      translations: this.resource.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
      })),
    }
  }
}
