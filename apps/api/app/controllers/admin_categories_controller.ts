import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import CategoryTranslation from '#models/category_translation'
import AdminCategoryTransformer from '#transformers/admin_category_transformer'
import { categoryValidator } from '#validators/category'
import { slugify } from '#models/seller'

/**
 * Managing the taxonomy without a deploy — the reason category names live in
 * the database rather than the language files.
 */
export default class AdminCategoriesController {
  async index({ serialize }: HttpContext) {
    const categories = await Category.query()
      .preload('translations')
      .withCount('products')
      .orderBy('position')

    return serialize(AdminCategoryTransformer.transform(categories))
  }

  async store({ request, response, serialize }: HttpContext) {
    const { position, isActive, translations } = await request.validateUsing(categoryValidator)

    const category = await db.transaction(async (trx) => {
      const created = new Category()
      created.useTransaction(trx)
      created.position = position ?? 0
      created.isActive = isActive ?? true
      await created.save()

      for (const translation of translations) {
        const row = new CategoryTranslation()
        row.useTransaction(trx)
        row.categoryId = created.id
        row.locale = translation.locale
        row.name = translation.name
        // Derived from the name unless given. `slugify` folds ä and ö, so a
        // Finnish name produces a usable slug rather than a mangled one.
        row.slug = translation.slug?.trim() || slugify(translation.name)
        await row.save()
      }

      return created
    })

    await category.load('translations')
    response.status(201)

    return serialize(AdminCategoryTransformer.transform(category))
  }

  async update({ params, request, response, serialize }: HttpContext) {
    const { position, isActive, translations } = await request.validateUsing(categoryValidator)

    const category = await Category.query().where('id', params.id).preload('translations').first()
    if (!category) {
      return response.notFound({
        errors: [{ code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' }],
      })
    }

    await db.transaction(async (trx) => {
      category.useTransaction(trx)
      if (position !== undefined) category.position = position
      if (isActive !== undefined) category.isActive = isActive
      await category.save()

      for (const translation of translations) {
        /**
         * Updated in place rather than replaced. The row's id is not
         * referenced anywhere, but recreating translations would churn the
         * unique index on `(locale, slug)` against itself mid-transaction.
         */
        const existing = category.translations.find((row) => row.locale === translation.locale)
        const row = existing ?? new CategoryTranslation()
        row.useTransaction(trx)
        row.categoryId = category.id
        row.locale = translation.locale
        row.name = translation.name
        row.slug = translation.slug?.trim() || slugify(translation.name)
        await row.save()
      }
    })

    await category.load('translations')

    return serialize(AdminCategoryTransformer.transform(category))
  }
}
