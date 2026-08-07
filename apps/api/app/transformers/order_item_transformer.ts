import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'productTitle',
        'productSlug',
        'variantLabel',
        'currency',
        'quantity',
      ]),
      unitPriceCents: Number(this.resource.unitPriceCents),
      imageUrl: this.resource.imagePath ? `/uploads/${this.resource.imagePath}` : null,
    }
  }
}
