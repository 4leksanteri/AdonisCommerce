import { ProductOptionSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'
import ProductOptionValue from '#models/product_option_value'

export default class ProductOption extends ProductOptionSchema {
  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @hasMany(() => ProductOptionValue)
  declare values: HasMany<typeof ProductOptionValue>
}
