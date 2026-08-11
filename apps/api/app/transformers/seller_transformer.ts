import type Seller from '#models/seller'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SellerTransformer extends BaseTransformer<Seller> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'shopName',
        'slug',
        'description',
        'status',
        'payoutStatus',
        'currency',
        'country',
        'createdAt',
      ]),
      // A URL rather than the stored filename — where files are served from
      // is a deployment detail, not something every client should know.
      avatarUrl: this.resource.avatarPath ? `/uploads/${this.resource.avatarPath}` : null,
    }
  }
}
