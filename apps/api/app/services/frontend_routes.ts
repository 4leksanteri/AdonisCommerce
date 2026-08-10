import env from '#start/env'

/**
 * Localized path segments for frontend pages the API links to (e.g. in
 * emails). Must be kept in sync with `pathnames` in the web app's
 * i18n/routing.ts — there is no automated check for this today.
 */
const RESET_PASSWORD_PATH = {
  en: '/en/reset-password',
  fi: '/fi/salasanan-nollaus',
} as const

const SELLER_PAYOUTS_PATH = {
  en: '/en/seller/payouts',
  fi: '/fi/myyja/tilitykset',
} as const

export function resetPasswordUrl(locale: 'en' | 'fi', token: string, email: string) {
  const path = RESET_PASSWORD_PATH[locale]
  return `${env.get('FRONTEND_URL')}${path}?token=${token}&email=${encodeURIComponent(email)}`
}

/** Where Stripe returns the seller to after hosted onboarding. */
export function sellerPayoutsUrl(locale: 'en' | 'fi') {
  return `${env.get('FRONTEND_URL')}${SELLER_PAYOUTS_PATH[locale]}`
}

const BUYER_ORDER_PATH = {
  en: '/en/orders',
  fi: '/fi/tilaukset',
} as const

const SELLER_ORDER_PATH = {
  en: '/en/seller/orders',
  fi: '/fi/myyja/tilaukset',
} as const

/** Where a buyer follows a notification about their own order. */
export function buyerOrderUrl(locale: 'en' | 'fi', reference: string) {
  return `${env.get('FRONTEND_URL')}${BUYER_ORDER_PATH[locale]}/${encodeURIComponent(reference)}`
}

/** The seller's view of the same order — keyed by id, not reference. */
export function sellerOrderUrl(locale: 'en' | 'fi', orderId: string) {
  return `${env.get('FRONTEND_URL')}${SELLER_ORDER_PATH[locale]}/${orderId}`
}
