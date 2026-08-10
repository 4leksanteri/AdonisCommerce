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

        return { ignored: job.name }
      },
      { connection: queueConnection, concurrency: 5 }
    )

    worker.on('failed', (job, error) => {
      this.logger.error(`${job?.name} ${job?.id} failed: ${error.message}`)
    })

    worker.on('completed', (job, result) => {
      this.logger.info(`${job.name} ${job.id}: ${JSON.stringify(result)}`)
    })

    this.logger.info('Queue worker ready')

    this.app.terminating(async () => {
      await worker.close()
    })
  }
}
