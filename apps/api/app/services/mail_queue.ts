import { Queue } from 'bullmq'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import { queueConnection } from '#services/queue'

export const MAIL_QUEUE = 'mail'

/**
 * What `mail.sendLater()` hands us: an already-compiled message, so the job
 * payload is plain data and needs no model lookups when it runs.
 */
export type QueuedMail = { message: unknown; views: unknown }

export const mailQueue = new Queue(MAIL_QUEUE, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

/**
 * Routes every `mail.sendLater()` through Redis instead of Adonis's default
 * in-memory queue.
 *
 * The default holds pending mail in the process, so a restart drops it and a
 * mail server having a bad minute loses the message outright. These are
 * order notifications — someone is waiting to hear that their parcel is on
 * its way — so they need to survive both.
 *
 * It also keeps SMTP off the request path: marking an order as sent must not
 * fail, or hang, because a mail host is slow.
 */
export function useRedisMailMessenger() {
  mail.setMessenger(() => ({
    async queue(payload) {
      await mailQueue.add('send', payload)
      logger.debug({ subject: (payload.message as { subject?: string }).subject }, 'Queued email')
    },
  }))
}
