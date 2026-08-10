import type { HttpContext } from '@adonisjs/core/http'
import { isSupportedLocale, loadTranslations } from '#services/translations'

export default class TranslationsController {
  async show({ params, response }: HttpContext) {
    const locale = params.locale as string

    if (!isSupportedLocale(locale)) {
      return response.notFound({ errors: [{ message: `Unsupported locale: ${locale}` }] })
    }

    return loadTranslations(locale)
  }
}
