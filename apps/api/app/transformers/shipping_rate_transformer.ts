import type ShippingRate from '#models/shipping_rate'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ShippingRateTransformer extends BaseTransformer<ShippingRate> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'destination']),
      firstItemCents: Number(this.resource.firstItemCents),
      additionalItemCents: Number(this.resource.additionalItemCents),
    }
  }
}
