import type ProductOptionValue from '#models/product_option_value'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProductOptionValueTransformer extends BaseTransformer<ProductOptionValue> {
  toObject() {
    return this.pick(this.resource, ['id', 'value', 'position'])
  }
}
