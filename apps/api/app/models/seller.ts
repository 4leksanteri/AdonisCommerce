import { SellerSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type User from '#models/user'
import Product from '#models/product'

/**
 * `normalize('NFD')` splits an accented letter into its base plus a combining
 * mark, which the next replace strips — so ä becomes a and ö becomes o.
 *
 * Without it every Finnish title produced a mangled slug: "Käsintehty
 * saippua" came out as `k-sintehty-saippua`, because ä is simply not in
 * `a-z0-9` and was replaced with a separator. On a Finnish marketplace that
 * was most of the catalogue, and slugs are what end up in URLs and in search
 * results.
 *
 * Existing slugs are left alone — they only regenerate when a title changes,
 * and rewriting them would break links that are already out there.
 */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default class Seller extends SellerSchema {
  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  /**
   * Instant-approved for now — `status` stays on the row so this can be
   * switched to a manual admin-gated flow later without a schema change.
   */
  static async applyFor(user: User, data: { shopName: string; description: string | null }) {
    const slug = await this.generateUniqueSlug(data.shopName)

    return this.create({
      userId: user.id,
      shopName: data.shopName,
      description: data.description,
      slug,
      status: 'approved',
      payoutStatus: 'not_connected',
    })
  }

  static async generateUniqueSlug(shopName: string) {
    const base = slugify(shopName) || 'shop'
    let slug = base
    let suffix = 1

    while (await this.query().where('slug', slug).first()) {
      suffix += 1
      slug = `${base}-${suffix}`
    }

    return slug
  }
}
