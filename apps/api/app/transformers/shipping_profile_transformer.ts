import type ShippingProfile from '#models/shipping_profile'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ShippingRateTransformer from '#transformers/shipping_rate_transformer'

export default class ShippingProfileTransformer extends BaseTransformer<ShippingProfile> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'createdAt']),
      // `rates` must be preloaded before transforming.
      rates: ShippingRateTransformer.transform(this.resource.rates),
    }
  }
}
