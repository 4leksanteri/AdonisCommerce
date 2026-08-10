import { Queue, type ConnectionOptions } from 'bullmq'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import type Order from '#models/order'

/**
 * BullMQ needs its own ioredis options rather than the `@adonisjs/redis`
 * client: it opens blocking connections of its own and requires
 * `maxRetriesPerRequest: null`, which the shared app connection must not have.
 */
export const queueConnection: ConnectionOptions = {
  host: env.get('REDIS_HOST'),
  port: env.get('REDIS_PORT'),
  password: env.get('REDIS_PASSWORD')?.release(),
  maxRetriesPerRequest: null,
}

export const PAYOUTS_QUEUE = 'payouts'

/** Release one order's held funds. */
export type ReleasePayoutJob = { name: 'release-payout'; data: { orderId: string } }
/** Catch-all sweep, in case a scheduled release was lost. */
export type SweepPayoutsJob = { name: 'sweep-payouts'; data: Record<string, never> }

export const payoutsQueue = new Queue(PAYOUTS_QUEUE, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
})

/**
 * Books the release for when the hold runs out.
 *
 * This is an optimisation, not the record. `orders.payout_release_at` is what
 * actually owes the seller money; the job just makes it happen on time. Redis
 * has been flushed in this project before, and the sweep exists so that
 * losing every scheduled job costs punctuality rather than payouts.
 *
 * The job id is derived from the order, so re-shipping or a retry replaces the
 * booking instead of stacking a second one.
 */
export async function schedulePayoutRelease(order: Order): Promise<void> {
  if (!order.payoutReleaseAt) return

  const delay = Math.max(0, order.payoutReleaseAt.toMillis() - Date.now())

  try {
    await payoutsQueue.add(
      'release-payout',
      { orderId: order.id },
      { delay, jobId: `release-${order.id}` }
    )
  } catch (error) {
    // Never fail the seller's "mark as sent" because Redis is having a day —
    // the sweep will pick this order up regardless.
    logger.error(
      { err: error, orderId: order.id },
      'Could not schedule the payout release; the sweep will catch it'
    )
  }
}

/**
 * Books the "has it arrived?" nudge for a few days after dispatch.
 *
 * Sent well before the hold expires so the buyer has time to act on it — and
 * because confirming early is the only way the seller gets paid quickly.
 * Domestic post arrives in days; a parcel abroad does not, so asking after
 * four days would just be noise.
 */
export async function scheduleDeliveryNudge(order: Order, days: number): Promise<void> {
  if (!order.shippedAt) return

  const due = order.shippedAt.plus({ days }).toMillis()

  try {
    await payoutsQueue.add(
      'delivery-nudge',
      { orderId: order.id },
      { delay: Math.max(0, due - Date.now()), jobId: `nudge-${order.id}` }
    )
  } catch (error) {
    // A missing nudge slows a payout down; it never loses one.
    logger.error({ err: error, orderId: order.id }, 'Could not schedule the delivery nudge')
  }
}

/**
 * The safety net: runs on a schedule and releases anything due, including
 * orders whose individual job never fired.
 */
export async function scheduleSweep(): Promise<void> {
  await payoutsQueue.upsertJobScheduler(
    'sweep-payouts',
    { pattern: '*/15 * * * *' },
    { name: 'sweep-payouts', data: {} }
  )
}
