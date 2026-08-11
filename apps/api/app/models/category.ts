import { CategorySchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import CategoryTranslation from '#models/category_translation'
import Product from '#models/product'

export default class Category extends CategorySchema {
  @belongsTo(() => Category, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Category>

  @hasMany(() => CategoryTranslation)
  declare translations: HasMany<typeof CategoryTranslation>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  /**
   * Falls back to whatever translation exists rather than rendering nothing.
   * A category with a missing translation is a content gap someone should
   * fix, not a reason for a product page to show a blank line.
   */
  translationFor(locale: string): CategoryTranslation | undefined {
    return (
      this.translations?.find((t) => t.locale === locale) ??
      this.translations?.find((t) => t.locale === 'en') ??
      this.translations?.[0]
    )
  }
}
