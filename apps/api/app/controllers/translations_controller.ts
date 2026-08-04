import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'

const SUPPORTED_LOCALES = ['en', 'fi'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

const cache = new Map<Locale, Record<string, unknown>>()

async function loadTranslations(locale: Locale) {
  const cached = cache.get(locale)
  if (cached) return cached

  const filePath = app.makePath('resources/lang', `${locale}.json`)
  const contents = JSON.parse(await readFile(filePath, 'utf-8'))
  cache.set(locale, contents)
  return contents
}

export default class TranslationsController {
  async show({ params, response }: HttpContext) {
    const locale = params.locale as string

    if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
      return response.notFound({ errors: [{ message: `Unsupported locale: ${locale}` }] })
    }

    return loadTranslations(locale as Locale)
  }
}
