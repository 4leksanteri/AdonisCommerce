import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { translate, type Locale } from '#services/translations'

export type TransactionalNotificationOptions = {
  to: string
  locale: Locale
  /** Key under `Emails` in the language files, e.g. `orderShipped`. */
  template: string
  params?: Record<string, string | number>
  action?: { url: string; labelKey?: string }
}

/**
 * Escaped because every value in these emails is user-supplied — shop names,
 * buyer names, the free-text reason a seller gave for cancelling. An
 * apostrophe in "Ale's Studio" would break the markup; a `<script>` in a
 * cancellation reason would be worse.
 */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * One notification class for every transactional email we send.
 *
 * The alternative — a class per email — would be a dozen near-identical
 * files differing only in which strings they read. The copy lives in the
 * language files where it can be translated and reviewed; this only decides
 * how it is laid out.
 *
 * Was `OrderNotification` until private messages needed the same envelope
 * and nothing about it was ever order-specific.
 */
export default class TransactionalNotification extends BaseMail {
  constructor(private options: TransactionalNotificationOptions) {
    super()
  }

  async prepare() {
    const { to, locale, template, params = {}, action } = this.options

    const t = (key: string) => translate(locale, `Emails.${template}.${key}`, params)

    const [subject, heading, body] = await Promise.all([t('subject'), t('heading'), t('body')])
    const actionLabel = action
      ? await translate(locale, `Emails.${action.labelKey ?? 'viewOrder'}`, params)
      : null

    this.message
      .to(to)
      .subject(subject)
      .html(
        layout({
          heading,
          body,
          action: action && actionLabel ? { url: action.url, label: actionLabel } : null,
          brand: env.get('APP_NAME'),
        })
      )
  }
}

/**
 * Every style is inline because Gmail strips `<style>` blocks, and the layout
 * is a single centred column because that is the one thing every mail client
 * renders the same way. Anything cleverer looks broken in Outlook.
 */
function layout(input: {
  heading: string
  body: string
  action: { url: string; label: string } | null
  brand: string
}) {
  const button = input.action
    ? `<p style="margin:24px 0 0">
         <a href="${escapeHtml(input.action.url)}"
            style="background:#171717;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:500">
           ${escapeHtml(input.action.label)}
         </a>
       </p>`
    : ''

  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5;color:#171717;max-width:520px;margin:0 auto;padding:24px">
    <h1 style="font-size:18px;font-weight:600;margin:0 0 12px">${escapeHtml(input.heading)}</h1>
    <p style="margin:0;color:#404040">${escapeHtml(input.body)}</p>
    ${button}
    <p style="margin:32px 0 0;font-size:12px;color:#737373">${escapeHtml(input.brand)}</p>
  </div>`
}
