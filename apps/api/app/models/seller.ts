import { SellerSchema } from '#database/schema'
import type User from '#models/user'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default class Seller extends SellerSchema {
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
