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
        // The language their emails are written in, which is a setting they
        // own rather than whichever locale this request happened to use.
        'locale',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      /**
       * The answers, not the input. Sending `role` alone would make every
       * client re-derive "does admin count as staff?", and the second copy of
       * that rule is the one that goes stale.
       */
      canAccessStaffPanel: this.resource.canAccessStaffPanel,
      canAccessAdminPanel: this.resource.canAccessAdminPanel,
      // `seller` must be preloaded via `user.load('seller')` before
      // transforming — Lucid won't lazy-load it.
      seller: this.resource.seller ? SellerTransformer.transform(this.resource.seller) : null,
    }
  }
}
