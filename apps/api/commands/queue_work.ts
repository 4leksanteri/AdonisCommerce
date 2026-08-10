import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'

/**
 * Runs the background workers. A separate process from the HTTP server: a
 * fourteen-day delayed job has to be picked up by something that is still
 * alive and not busy serving requests.
 *
 * `node ace queue:work`
 */
export default class QueueWork extends BaseCommand {
  static commandName = 'queue:work'
  static description = 'Process background jobs (payout releases and the sweep)'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { PAYOUTS_QUEUE, queueConnection, scheduleSweep } = await import('#services/queue')
    const { completeOrder, releaseDuePayouts } = await import('#services/payments')
    const { notifyDeliveryDue } = await import('#services/order_notifications')
    const { default: Order } = await import('#models/order')

    await scheduleSweep()

    const worker = new Worker(
      PAYOUTS_QUEUE,
      async (job) => {
        if (job.name === 'sweep-payouts') {
          const released = await releaseDuePayouts()
          return { released }
        }

        if (job.name === 'release-payout') {
          const order = await Order.query().where('id', job.data.orderId).preload('seller').first()

          // Cancelled, refunded, or already paid out — all normal, and none of
          // them a reason to retry.
          if (!order || order.status !== 'shipped') return { skipped: true }

          /**
           * Re-checked here rather than trusted from when the job was booked.
           * Two weeks is plenty of time for a buyer to raise a problem, and
           * paying the seller in the middle of one would defeat the hold.
           */
          const open = await order.related('disputes').query().where('status', 'open').first()
          if (open) return { held: true }

          await completeOrder(order)
          return { completed: order.reference }
        }

        if (job.name === 'delivery-nudge') {
          const order = await Order.query().where('id', job.data.orderId).preload('seller').first()

          // Already confirmed, disputed or cancelled — in every one of those
          // the buyer has answered the question this email would ask.
          if (!order || order.status !== 'shipped') return { skipped: true }

          await notifyDeliveryDue(order)
          return { nudged: order.reference }
        }

        return { ignored: job.name }
      },
      { connection: queueConnection, concurrency: 5 }
    )

    /**
     * A second queue rather than more job types on the first: a mail host
     * being slow must not sit in front of a payout, and the two want very
     * different retry behaviour.
     */
    const { MAIL_QUEUE } = await import('#services/mail_queue')
    const { default: mail } = await import('@adonisjs/mail/services/main')

    const mailWorker = new Worker(
      MAIL_QUEUE,
      async (job) => {
        // `sendCompiled` takes exactly what `sendLater` handed the messenger,
        // so nothing has to be rebuilt from the model here. It lives on the
        // mailer rather than the manager, hence `use()`.
        await mail.use().sendCompiled(job.data)
        return { sent: job.data?.message?.subject }
      },
      { connection: queueConnection, concurrency: 5 }
    )

    for (const [name, instance] of [
      ['payouts', worker],
      ['mail', mailWorker],
    ] as const) {
      instance.on('failed', (job, error) => {
        this.logger.error(`[${name}] ${job?.name} ${job?.id} failed: ${error.message}`)
      })
      instance.on('completed', (job, result) => {
        this.logger.info(`[${name}] ${job.name} ${job.id}: ${JSON.stringify(result)}`)
      })
    }

    this.logger.info('Queue worker ready')

    this.app.terminating(async () => {
      await Promise.all([worker.close(), mailWorker.close()])
    })
  }
}
