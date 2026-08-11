import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ReviewTransformer from '#transformers/review_transformer'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      // Absent unless preloaded, so a missing preload can't read as
      // "not reviewed yet" and offer the form a second time.
      review: ReviewTransformer.transform(this.whenLoaded(this.resource.review)),
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
