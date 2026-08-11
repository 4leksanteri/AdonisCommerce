import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * What a staff member needs to know on opening the panel.
 *
 * Deliberately only figures somebody would act on. Revenue and order counts
 * belong to whoever runs the business, not to whoever is settling a case, and
 * a dashboard padded with numbers nobody acts on trains people to skim past
 * the ones that matter.
 */
export default class StaffOverviewController {
  async show({ serialize }: HttpContext) {
    const [disputes, settled, stuck, held] = await Promise.all([
      db
        .from('disputes')
        .where('status', 'open')
        .count('* as total')
        .min('created_at as oldest')
        .first(),

      db
        .from('disputes')
        .whereNotNull('resolved_at')
        .where('resolved_at', '>', db.raw("NOW() - interval '7 days'"))
        .count('* as total')
        .first(),

      /**
       * Orders that finished but never paid out. The sweep retries these, so
       * a number that stays above zero means something is failing repeatedly
       * — a seller's Stripe account gone, most likely — and nothing else
       * surfaces it.
       */
      db
        .from('orders')
        .where('status', 'completed')
        .whereNull('stripe_transfer_id')
        .count('* as total')
        .first(),

      /**
       * Money sitting on the platform balance waiting for orders to close.
       * Grouped by currency rather than summed: adding euros to kronor gives
       * a number that looks right and means nothing.
       */
      db
        .from('orders')
        .where('status', 'shipped')
        .whereNull('stripe_transfer_id')
        .groupBy('currency')
        .select('currency')
        // Raw rather than `.sum()`: knex quotes that argument as a column
        // name, so an expression comes out as a broken identifier.
        .select(db.raw('COUNT(*)::int as orders'))
        .select(
          db.raw('SUM(subtotal_cents + shipping_cents - platform_fee_cents)::bigint as cents')
        ),
    ])

    return serialize({
      openDisputes: Number(disputes?.total ?? 0),
      oldestDisputeAt: disputes?.oldest ?? null,
      settledLastWeek: Number(settled?.total ?? 0),
      stuckPayouts: Number(stuck?.total ?? 0),
      heldPayouts: held.map((row: { currency: string; orders: string; cents: string }) => ({
        currency: row.currency,
        orders: Number(row.orders),
        cents: Number(row.cents),
      })),
    })
  }
}
