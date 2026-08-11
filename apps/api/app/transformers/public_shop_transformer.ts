import type Seller from '#models/seller'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * A shop as a shopper sees it. Deliberately narrower than
 * `SellerTransformer`, which is the seller's own view of their account:
 * `status` and `payoutStatus` are internal, and whether a shop's payouts are
 * in order is nobody else's business.
 *
 * `country` is exposed as a bare code rather than folded into a sentence.
 * Finnish inflects place names — "toimittaa Suomesta", not "Suomi" — and no
 * formatting API produces those endings, so the page pairs it with a
 * standalone label instead.
 */
export default class PublicShopTransformer extends BaseTransformer<Seller> {
  toObject() {
    return {
      name: this.resource.shopName,
      slug: this.resource.slug,
      description: this.resource.description,
      country: this.resource.country,
      /** When the shop opened — the closest thing to a track record we have. */
      memberSince: this.resource.createdAt,
    }
  }
}
