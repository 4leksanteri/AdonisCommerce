import { ProductSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Seller, { slugify } from '#models/seller'
import ProductOption from '#models/product_option'
import ProductVariant from '#models/product_variant'
import ProductImage from '#models/product_image'

export default class Product extends ProductSchema {
  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => ProductOption)
  declare options: HasMany<typeof ProductOption>

  @hasMany(() => ProductVariant)
  declare variants: HasMany<typeof ProductVariant>

  @hasMany(() => ProductImage)
  declare images: HasMany<typeof ProductImage>

  static async generateUniqueSlug(title: string) {
    const base = slugify(title) || 'product'
    let slug = base
    let suffix = 1

    while (await this.query().where('slug', slug).first()) {
      suffix += 1
      slug = `${base}-${suffix}`
    }

    return slug
  }
}
