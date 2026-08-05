import { ProductVariantSchema } from '#database/schema'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import ProductOptionValue from '#models/product_option_value'

export default class ProductVariant extends ProductVariantSchema {
  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @manyToMany(() => ProductOptionValue, {
    pivotTable: 'product_variant_option_values',
  })
  declare optionValues: ManyToMany<typeof ProductOptionValue>
}
