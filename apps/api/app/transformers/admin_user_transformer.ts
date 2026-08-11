import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * The admin view of an account. Carries the email in full, which is the point
 * of the panel being gated — everywhere else on the platform a person is a
 * first name and an initial.
 */
export default class AdminUserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'fullName', 'email', 'role', 'createdAt']),
      shop: this.resource.seller
        ? { name: this.resource.seller.shopName, slug: this.resource.seller.slug }
        : null,
      // Who granted the current role, so a surprise can be traced to a person.
      roleChangedAt: this.resource.roleChangedAt,
      roleChangedBy: this.resource.roleChangedBy?.email ?? null,
    }
  }
}
