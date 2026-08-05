import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'
import SellerTransformer from '#transformers/seller_transformer'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'role',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      // `seller` must be preloaded via `user.load('seller')` before
      // transforming — Lucid won't lazy-load it.
      seller: this.resource.seller ? SellerTransformer.transform(this.resource.seller) : null,
    }
  }
}
