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

export function resetPasswordUrl(locale: 'en' | 'fi', token: string, email: string) {
  const path = RESET_PASSWORD_PATH[locale]
  return `${env.get('FRONTEND_URL')}${path}?token=${token}&email=${encodeURIComponent(email)}`
}
