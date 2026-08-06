import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  type SupportedCurrency,
} from '#services/currencies'

const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
const CACHE_KEY = 'exchange-rates:ecb'

/** Rates per 1 EUR, e.g. `{ EUR: 1, USD: 1.1554 }`. */
export type ExchangeRates = Record<string, number>

/**
 * The ECB publishes reference rates as a small XML document once a business
 * day, free and without a key. Parsed with a regex rather than an XML
 * dependency — the document is a flat list of `currency`/`rate` pairs and
 * has been stable for two decades.
 */
function parseEcbRates(xml: string): ExchangeRates {
  const rates: ExchangeRates = { [DEFAULT_CURRENCY]: 1 }

  for (const match of xml.matchAll(/currency=['"](\w{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    const [, code, rate] = match
    if (SUPPORTED_CURRENCIES.includes(code as SupportedCurrency)) {
      rates[code] = Number(rate)
    }
  }

  return rates
}

/**
 * Cached for six hours — the ECB only updates around 16:00 CET, so a shorter
 * window would just add failure modes for no fresher data.
 *
 * On failure this returns EUR alone rather than throwing or serving a
 * fabricated rate. Callers treat a missing rate as "can't convert" and fall
 * back to the price's own currency, which is always correct if unhelpful.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  return cache.getOrSet({
    key: CACHE_KEY,
    ttl: '6h',
    factory: async () => {
      try {
        const response = await fetch(ECB_DAILY_URL, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error(`ECB responded ${response.status}`)

        const rates = parseEcbRates(await response.text())
        if (Object.keys(rates).length <= 1) throw new Error('No supported currencies in feed')

        return rates
      } catch (error) {
        logger.error({ err: error }, 'Failed to fetch ECB exchange rates')
        return { [DEFAULT_CURRENCY]: 1 }
      }
    },
  })
}
