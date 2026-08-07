import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'
import OrderItemTransformer from '#transformers/order_item_transformer'

export default class OrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'reference',
        'sellerOrderNumber',
        'status',
        'currency',
        'createdAt',
      ]),
      subtotalCents: Number(this.resource.subtotalCents),
      shippingCents: Number(this.resource.shippingCents),
      totalCents: Number(this.resource.subtotalCents) + Number(this.resource.shippingCents),
      // `seller` and `items` must be preloaded before transforming.
      shop: {
        name: this.resource.seller.shopName,
        slug: this.resource.seller.slug,
      },
      shipping: {
        name: this.resource.shippingName,
        line1: this.resource.shippingLine1,
        line2: this.resource.shippingLine2,
        city: this.resource.shippingCity,
        postalCode: this.resource.shippingPostalCode,
        country: this.resource.shippingCountry,
      },
      contactEmail: this.resource.contactEmail,
      items: OrderItemTransformer.transform(this.resource.items),
    }
  }
}
