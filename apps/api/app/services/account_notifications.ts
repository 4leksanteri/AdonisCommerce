import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import TransactionalNotification from '#mails/transactional_notification'
import type User from '#models/user'
import { toLocale } from '#services/translations'

/**
 * Tells someone their credentials moved.
 *
 * The point is not to inform the person who did it — they were there. It is
 * to reach the person who *didn't*, on the address an attacker has just
 * finished taking away from them. This is the only warning a hijacked
 * account gets, so it is sent to the old address, not the new one.
 */
async function warn(to: string, user: User, template: string, params: Record<string, string>) {
  try {
    await mail.sendLater(
      new TransactionalNotification({
        to,
        locale: toLocale(user.locale),
        template,
        params,
      })
    )
  } catch (error) {
    // Never let a mail failure undo the change that triggered it — the new
    // password is already saved, and refusing it now would be worse.
    logger.error({ err: error, template, to }, 'Could not queue an account security email')
  }
}

/**
 * `previousEmail` is where this goes. Sending it to the new address would
 * only tell whoever performed the change what they already know.
 */
export function notifyEmailChanged(user: User, previousEmail: string) {
  return warn(previousEmail, user, 'emailChanged', { newEmail: user.email })
}

export function notifyPasswordChanged(user: User) {
  return warn(user.email, user, 'passwordChanged', {})
}
