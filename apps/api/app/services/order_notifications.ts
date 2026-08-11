import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import OrderNotification from '#mails/order_notification'
import User from '#models/user'
import type Order from '#models/order'
import OrderMessage from '#models/order_message'
import { DateTime } from 'luxon'
import { toLocale, type Locale } from '#services/translations'
import { buyerOrderUrl, sellerOrderUrl } from '#services/frontend_routes'
import { orderTotalCents } from '#services/payments'

/**
 * Who to write to and in which language, for both sides of an order.
 *
 * The seller's address is their account email rather than the shop's contact
 * details, because the shop record has none — worth revisiting when seller
 * profiles land.
 */
async function recipients(order: Order) {
  if (!order.seller) await order.load('seller')

  const [buyer, sellerUser] = await Promise.all([
    User.find(order.userId),
    User.find(order.seller.userId),
  ])

  return {
    buyer: buyer && { userId: buyer.id, email: order.contactEmail, locale: toLocale(buyer.locale) },
    seller: sellerUser && {
      userId: sellerUser.id,
      email: sellerUser.email,
      locale: toLocale(sellerUser.locale),
    },
  }
}

/** Money as the recipient's locale writes it — 55,40 € rather than €55.40 in Finnish. */
function money(cents: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}

/**
 * Every order email goes through here so a mail failure can never take down
 * the thing that triggered it. Marking an order as sent must succeed whether
 * or not the mail host is having a good day; `sendLater` only enqueues, and
 * even that is wrapped because Redis can be down too.
 */
async function notify(
  who: { userId?: string; email: string; locale: Locale } | null | undefined,
  template: string,
  params: Record<string, string | number>,
  url: string,
  labelKey?: string
) {
  if (!who) return

  try {
    await mail.sendLater(
      new OrderNotification({
        to: who.email,
        locale: who.locale,
        template,
        params,
        action: { url, labelKey },
      })
    )
  } catch (error) {
    logger.error({ err: error, template, to: who.email }, 'Could not queue an order email')
  }
}

/** Common substitutions every template can reach for. */
function baseParams(order: Order, locale: Locale) {
  return {
    orderNumber: order.sellerOrderNumber,
    reference: order.reference,
    shopName: order.shopName,
    buyerName: order.shippingName,
    total: money(orderTotalCents(order), order.currency, locale),
  }
}

/** Payment cleared: the buyer gets a confirmation, the seller gets a job. */
export async function notifyOrderPaid(order: Order) {
  const { buyer, seller } = await recipients(order)

  await notify(
    buyer,
    'orderPlaced',
    baseParams(order, buyer?.locale ?? 'en'),
    buyerOrderUrl(buyer?.locale ?? 'en', order.reference)
  )
  await notify(
    seller,
    'orderReceived',
    baseParams(order, seller?.locale ?? 'en'),
    sellerOrderUrl(seller?.locale ?? 'en', order.id),
    'viewInPanel'
  )
}

export async function notifyOrderAccepted(order: Order) {
  const { buyer } = await recipients(order)
  await notify(
    buyer,
    'orderAccepted',
    baseParams(order, buyer?.locale ?? 'en'),
    buyerOrderUrl(buyer?.locale ?? 'en', order.reference)
  )
}

export async function notifyOrderShipped(order: Order) {
  const { buyer } = await recipients(order)
  const locale = buyer?.locale ?? 'en'

  await notify(
    buyer,
    order.trackingNumber ? 'orderShippedTracked' : 'orderShipped',
    { ...baseParams(order, locale), tracking: order.trackingNumber ?? '' },
    buyerOrderUrl(locale, order.reference)
  )
}

/**
 * The nudge that makes the payment hold work.
 *
 * Confirming receipt is the fast path to the seller being paid, and nobody
 * visits an order page unprompted — without this every order would sit out
 * the full two-to-four week hold no matter how quickly it arrived.
 */
export async function notifyDeliveryDue(order: Order) {
  const { buyer } = await recipients(order)
  const locale = buyer?.locale ?? 'en'

  await notify(
    buyer,
    'deliveryNudge',
    baseParams(order, locale),
    buyerOrderUrl(locale, order.reference),
    'confirmOrReport'
  )
}

export async function notifyOrderCancelled(order: Order) {
  const { buyer } = await recipients(order)
  const locale = buyer?.locale ?? 'en'

  await notify(
    buyer,
    order.isRefunded ? 'orderRefunded' : 'orderCancelled',
    {
      ...baseParams(order, locale),
      refunded: money(Number(order.refundedCents), order.currency, locale),
      reason: order.cancelReason ?? '',
    },
    buyerOrderUrl(locale, order.reference)
  )
}

/** The seller needs to know immediately — their payout is now on hold. */
export async function notifyProblemReported(order: Order, reason: string) {
  const { seller } = await recipients(order)
  const locale = seller?.locale ?? 'en'

  await notify(
    seller,
    'problemReported',
    { ...baseParams(order, locale), reason },
    sellerOrderUrl(locale, order.id),
    'viewInPanel'
  )
}

export async function notifyPayoutReleased(order: Order) {
  const { seller } = await recipients(order)
  const locale = seller?.locale ?? 'en'

  await notify(
    seller,
    'payoutReleased',
    {
      ...baseParams(order, locale),
      payout: money(
        orderTotalCents(order) - Number(order.platformFeeCents),
        order.currency,
        locale
      ),
    },
    sellerOrderUrl(locale, order.id),
    'viewInPanel'
  )
}

/**
 * How recently someone must have written for us to assume they are still
 * reading, and skip emailing them. A back-and-forth would otherwise send a
 * notification per line.
 */
const PRESENT_WITHIN_MINUTES = 15

/**
 * Tells the other side there is a new message.
 *
 * Only the *other* side: the sender obviously knows, and staff are not
 * notified about ordinary buyer/seller traffic — they get told when a problem
 * is reported, which is when it becomes theirs. A message from staff goes to
 * both parties, since that is the platform stepping in.
 */
export async function notifyNewMessage(order: Order, message: OrderMessage) {
  const { buyer, seller } = await recipients(order)

  const audience =
    message.senderRole === 'buyer'
      ? [seller]
      : message.senderRole === 'seller'
        ? [buyer]
        : [buyer, seller]

  for (const who of audience) {
    if (!who) continue

    // Someone who wrote a moment ago is plainly still reading; emailing them
    // about the reply they are watching arrive is just noise.
    if (who.userId && (await isPresentInThread(order.id, who.userId))) continue

    const locale = who.locale
    await notify(
      who,
      message.senderRole === 'staff' ? 'messageFromStaff' : 'messageReceived',
      {
        ...baseParams(order, locale),
        // Trimmed rather than sent whole: an email is a nudge to come and
        // read, and a full copy invites replying to a mailbox nobody reads.
        excerpt: message.body.length > 140 ? `${message.body.slice(0, 140)}…` : message.body,
      },
      buyerOrderUrl(locale, order.reference),
      'readMessage'
    )
  }
}

/**
 * True when this person has written in the thread recently enough that they
 * are plainly still there — no need to email them about a reply they are
 * about to see.
 */
export async function isPresentInThread(orderId: string, userId: string): Promise<boolean> {
  const recent = await OrderMessage.query()
    .where('orderId', orderId)
    .where('senderUserId', userId)
    .where('createdAt', '>', DateTime.now().minus({ minutes: PRESENT_WITHIN_MINUTES }).toSQL()!)
    .first()

  return recent !== null
}
