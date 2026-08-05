import { ProductOptionValueSchema } from '#database/schema'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ProductOption from '#models/product_option'
import ProductVariant from '#models/product_variant'

export default class ProductOptionValue extends ProductOptionValueSchema {
  @belongsTo(() => ProductOption)
  declare option: BelongsTo<typeof ProductOption>

  @manyToMany(() => ProductVariant, {
    pivotTable: 'product_variant_option_values',
  })
  declare variants: ManyToMany<typeof ProductVariant>
}
