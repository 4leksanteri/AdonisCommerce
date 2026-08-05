import { ProductImageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

export default class ProductImage extends ProductImageSchema {
  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
