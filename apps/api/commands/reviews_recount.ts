import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Rebuilds `products.rating_count` / `rating_sum` from the reviews themselves.
 *
 * The write path keeps them up to date incrementally, which is O(1) but has
 * no way to notice if it ever drifts. A rating shown on every product card is
 * worth being able to repair without a deploy.
 */
export default class ReviewsRecount extends BaseCommand {
  static commandName = 'reviews:recount'
  static description = "Rebuild every product's rating totals from its reviews"
  static options: CommandOptions = { startApp: true }

  @args.string({ required: false, description: 'Limit to a single product id' })
  declare productId?: string

  async run() {
    const { recountProductRatings } = await import('#services/reviews')
    const corrected = await recountProductRatings(this.productId)
    this.logger.info(`Corrected ${corrected} product(s)`)
  }
}
