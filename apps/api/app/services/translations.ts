import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

export const SUPPORTED_LOCALES = ['en', 'fi'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

const cache = new Map<Locale, Record<string, unknown>>()

/**
 * Cached for the life of the process, which is why editing a lang file in
 * development shows nothing until the server restarts.
 */
export async function loadTranslations(locale: Locale) {
  const cached = cache.get(locale)
  if (cached) return cached

  const filePath = app.makePath('resources/lang', `${locale}.json`)
  const contents = JSON.parse(await readFile(filePath, 'utf-8'))
  cache.set(locale, contents)
  return contents
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Falls back to the default locale for anything unrecognised or missing. */
export function toLocale(value: string | null | undefined): Locale {
  return value && isSupportedLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Reads a dotted key out of the language file and fills in `{placeholders}`.
 *
 * Deliberately not an ICU formatter. Email copy here is plain sentences with
 * values dropped in — the plurals and number formatting live in the browser,
 * where `next-intl` already does them properly — and pulling a full ICU
 * runtime into the API to interpolate a shop name would be a poor trade.
 *
 * A missing key returns the key itself rather than throwing: an email that
 * reads slightly wrong still tells someone their parcel shipped, whereas one
 * that fails to render tells them nothing.
 */
export async function translate(
  locale: Locale,
  key: string,
  params: Record<string, string | number> = {}
): Promise<string> {
  const messages = await loadTranslations(locale)

  let node: unknown = messages
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return key
    node = (node as Record<string, unknown>)[part]
  }

  if (typeof node !== 'string') return key

  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}
