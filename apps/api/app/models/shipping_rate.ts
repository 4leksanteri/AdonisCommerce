import { ShippingRateSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ShippingProfile from '#models/shipping_profile'

export default class ShippingRate extends ShippingRateSchema {
  @belongsTo(() => ShippingProfile)
  declare profile: BelongsTo<typeof ShippingProfile>
}
