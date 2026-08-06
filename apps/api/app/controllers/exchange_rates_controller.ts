import type { HttpContext } from '@adonisjs/core/http'
import { getExchangeRates } from '#services/exchange_rates'

export default class ExchangeRatesController {
  /**
   * Rates per 1 EUR, for the storefront's approximate-price display. Public
   * and unauthenticated — the same numbers the ECB publishes for anyone.
   */
  async index({ response }: HttpContext) {
    const rates = await getExchangeRates()

    return response.ok({ base: 'EUR', rates })
  }
}
