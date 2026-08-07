import { ShippingProfileSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Seller from '#models/seller'
import ShippingRate from '#models/shipping_rate'

export default class ShippingProfile extends ShippingProfileSchema {
  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @hasMany(() => ShippingRate)
  declare rates: HasMany<typeof ShippingRate>
}
