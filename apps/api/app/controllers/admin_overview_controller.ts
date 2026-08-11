import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * The owner's view, as distinct from the staff queue: staff see what needs a
 * decision, this shows what the platform is.
 */
export default class AdminOverviewController {
  async show({ serialize }: HttpContext) {
    const [users, shops, listings, earnings] = await Promise.all([
      db
        .from('users')
        .select(db.raw('COUNT(*)::int as total'))
        .select(db.raw("COUNT(*) FILTER (WHERE role IN ('staff','admin'))::int as team"))
        .select(
          db.raw("COUNT(*) FILTER (WHERE created_at > NOW() - interval '7 days')::int as recent")
        )
        .first(),

      db
        .from('sellers')
        .select(db.raw('COUNT(*)::int as total'))
        // A shop that can't take payments can't sell, so the two numbers are
        // worth seeing side by side.
        .select(db.raw("COUNT(*) FILTER (WHERE payout_status = 'connected')::int as payable"))
        .first(),

      db
        .from('products')
        .select(db.raw("COUNT(*) FILTER (WHERE status = 'active')::int as active"))
        .select(db.raw('COUNT(*) FILTER (WHERE category_id IS NULL)::int as uncategorised'))
        .first(),

      /**
       * Commission on orders that actually completed, grouped by currency —
       * summing euros and kronor would give a number that looks right and
       * means nothing. Cancelled and refunded orders are excluded: the fee
       * comes back out of the platform's balance on a refund.
       */
      db
        .from('orders')
        .whereIn('status', ['completed', 'shipped', 'accepted', 'paid'])
        .groupBy('currency')
        .select('currency')
        .select(db.raw('COUNT(*)::int as orders'))
        .select(db.raw('SUM(platform_fee_cents)::bigint as cents')),
    ])

    return serialize({
      users: {
        total: Number(users?.total ?? 0),
        team: Number(users?.team ?? 0),
        newThisWeek: Number(users?.recent ?? 0),
      },
      shops: { total: Number(shops?.total ?? 0), payable: Number(shops?.payable ?? 0) },
      listings: {
        active: Number(listings?.active ?? 0),
        // Products that predate the taxonomy, so someone can see the backlog
        // shrink as sellers edit them.
        uncategorised: Number(listings?.uncategorised ?? 0),
      },
      commission: earnings.map((row: { currency: string; orders: string; cents: string }) => ({
        currency: row.currency,
        orders: Number(row.orders),
        cents: Number(row.cents),
      })),
    })
  }
}
