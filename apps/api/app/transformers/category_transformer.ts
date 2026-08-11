import type Category from '#models/category'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A category in one language. The locale is a constructor argument rather
 * than something the transformer guesses, because the same category is
 * rendered differently depending on who is asking.
 */
export default class CategoryTransformer extends BaseTransformer<Category> {
  constructor(
    category: Category,
    private locale: string
  ) {
    super(category)
  }

  toObject() {
    const translation = this.resource.translationFor(this.locale)

    return {
      id: this.resource.id,
      name: translation?.name ?? '',
      slug: translation?.slug ?? '',
    }
  }
}
