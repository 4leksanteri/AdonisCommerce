import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import Seller from '#models/seller'

/**
 * Deleting an account means **anonymising this row**, not removing it.
 *
 * `orders.user_id` and `orders.seller_id` both RESTRICT, so a user who has
 * ever bought or sold cannot be deleted at all — those are financial records
 * and have to be retained. Erasure therefore has to mean clearing the
 * personal fields in place: blank `full_name`, replace `email` with a
 * non-routable placeholder, scramble the password.
 *
 * Reviews are deliberately kept. `reviews.user_id` is SET NULL, and a review
 * with no author renders as "Someone" — the personal data goes, the opinion
 * other shoppers relied on stays. Etsy does the same. Deleting the reviews
 * instead would let anyone rewrite a shop's history by closing an account.
 *
 * None of this is implemented yet; there is no delete-account endpoint. The
 * foreign keys are set up so that whoever builds one inherits the right
 * behaviour rather than discovering it.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @hasOne(() => Seller)
  declare seller: HasOne<typeof Seller>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  get isAdmin() {
    return this.role === 'admin'
  }
}
