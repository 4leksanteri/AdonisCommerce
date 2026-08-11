import { ProductSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Seller, { slugify } from '#models/seller'
import ProductOption from '#models/product_option'
import ProductVariant from '#models/product_variant'
import ProductImage from '#models/product_image'
import ShippingProfile from '#models/shipping_profile'
import Review from '#models/review'

export default class Product extends ProductSchema {
  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => ProductOption)
  declare options: HasMany<typeof ProductOption>

  @hasMany(() => ProductVariant)
  declare variants: HasMany<typeof ProductVariant>

  @hasMany(() => ProductImage)
  declare images: HasMany<typeof ProductImage>

  @belongsTo(() => ShippingProfile)
  declare shippingProfile: BelongsTo<typeof ShippingProfile>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  /**
   * Divided at read time rather than stored. The count and sum are integers
   * kept exact by incremental updates; an average column would accumulate
   * rounding error every time it was rewritten.
   */
  get ratingAverage(): number | null {
    return this.ratingCount > 0 ? this.ratingSum / this.ratingCount : null
  }

  /**
   * Slugs only have to be unique within a shop, so collisions are resolved
   * against that seller's own products — another seller already owning
   * "ceramic-mug" is not a clash. Mirrors the (seller_id, slug) unique index.
   *
   * `excludeId` keeps a product from colliding with itself when re-slugging
   * on edit — without it, saving would walk the suffix up on every save.
   */
  static async generateUniqueSlug(sellerId: string, title: string, excludeId?: string) {
    const base = slugify(title) || 'product'
    let slug = base
    let suffix = 1

    while (
      await this.query()
        .where('sellerId', sellerId)
        .where('slug', slug)
        .if(excludeId !== undefined, (query) => query.whereNot('id', excludeId!))
        .first()
    ) {
      suffix += 1
      slug = `${base}-${suffix}`
    }

    return slug
  }
}
