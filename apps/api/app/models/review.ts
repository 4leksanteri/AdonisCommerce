import { ReviewSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Product from '#models/product'
import Seller from '#models/seller'
import OrderItem from '#models/order_item'

export const MIN_RATING = 1
export const MAX_RATING = 5

export default class Review extends ReviewSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Seller)
  declare seller: BelongsTo<typeof Seller>

  @belongsTo(() => OrderItem)
  declare orderItem: BelongsTo<typeof OrderItem>

  /**
   * "Ale K." rather than the full name.
   *
   * Reviews are public and permanent, and someone buying a tea towel has not
   * agreed to have their full name indexed against it. An initial is enough
   * to read as a person, which is all the name is doing here.
   *
   * Null when there is no name to show — an erased account, or one that never
   * gave one. The fallback wording is copy, so it belongs in the language
   * files rather than here.
   */
  static displayName(fullName: string | null | undefined): string | null {
    const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return null
    if (parts.length === 1) return parts[0]

    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
  }
}
