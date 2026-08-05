import type ProductImage from '#models/product_image'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProductImageTransformer extends BaseTransformer<ProductImage> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'position']),
      // Relative — the frontend proxies /uploads/* to the API itself, so
      // the browser never needs (or sees) the API's real origin.
      url: `/uploads/${this.resource.path}`,
    }
  }
}
