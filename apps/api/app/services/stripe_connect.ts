import type Stripe from 'stripe'
import type Seller from '#models/seller'
import type User from '#models/user'
import { stripe } from '#config/stripe'
import { sellerPayoutsUrl } from '#services/frontend_routes'

export type PayoutStatus = 'not_connected' | 'connected' | 'restricted'

/**
 * What the seller panel needs to say something useful about payouts. Read
 * live from Stripe rather than mirrored into our schema: requirements change
 * per country and per seller, and a stale copy would be worse than none.
 */
export type PayoutDetails = {
  payoutStatus: PayoutStatus
  detailsSubmitted: boolean
  payoutsEnabled: boolean
  /** Set when Stripe has switched the account off, e.g. "requirements.past_due". */
  disabledReason: string | null
  /** True while Stripe is checking documents the seller has already provided. */
  pendingVerification: boolean
}

/**
 * Only `transfers` is requested.
 *
 * The buyer's card is charged on the platform account, and each seller is
 * paid by a separate Transfer, so a connected account never processes a card
 * itself. Asking for `card_payments` as well would put the seller through
 * merchant-of-record onboarding they have no use for.
 */
const REQUESTED_CAPABILITIES: Stripe.AccountCreateParams.Capabilities = {
  transfers: { requested: true },
}

/**
 * Creates the seller's Express account on first use and remembers its id.
 *
 * The idempotency key matters here: onboarding starts from a button, and a
 * double click would otherwise leave a second, orphaned account behind that
 * we have no record of and cannot pay out to.
 */
export async function ensureConnectAccount(seller: Seller, user: User): Promise<string> {
  if (seller.stripeAccountId) return seller.stripeAccountId

  const account = await stripe.accounts.create(
    {
      type: 'express',
      country: seller.country,
      email: user.email,
      capabilities: REQUESTED_CAPABILITIES,
      business_profile: { name: seller.shopName },
      metadata: { sellerId: seller.id },
    },
    { idempotencyKey: `connect-account-${seller.id}` }
  )

  seller.stripeAccountId = account.id
  await seller.save()

  return account.id
}

/**
 * A single-use link into Stripe's hosted onboarding. They expire after a few
 * minutes and can only be used once, so one is minted per button press rather
 * than stored.
 */
export async function onboardingLink(
  accountId: string,
  locale: 'en' | 'fi',
  isUpdate: boolean
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    // `refresh_url` is where Stripe sends the seller when the link has gone
    // stale — the page just asks for a new one, so both point at ours.
    refresh_url: sellerPayoutsUrl(locale),
    return_url: sellerPayoutsUrl(locale),
    type: isUpdate ? 'account_update' : 'account_onboarding',
  })

  return link.url
}

/** One-time sign-in to the Express dashboard, where Stripe shows payouts. */
export async function dashboardLink(accountId: string): Promise<string> {
  const link = await stripe.accounts.createLoginLink(accountId)
  return link.url
}

/**
 * Note this does *not* look at `charges_enabled` — a transfers-only account
 * never gets it, so treating it as a requirement would leave every properly
 * onboarded seller looking broken.
 *
 * Nor at `disabled_reason`, which a brand-new account already carries
 * (`requirements.past_due`, because it has been asked for everything and
 * given nothing). `details_submitted` is what actually separates "hasn't
 * started" from "started and Stripe isn't satisfied".
 */
export function payoutDetailsFor(account: Stripe.Account): PayoutDetails {
  const transfersActive = account.capabilities?.transfers === 'active'
  const payoutsEnabled = account.payouts_enabled === true
  const disabledReason = account.requirements?.disabled_reason ?? null
  const detailsSubmitted = account.details_submitted === true

  const payoutStatus: PayoutStatus =
    transfersActive && payoutsEnabled
      ? 'connected'
      : detailsSubmitted
        ? 'restricted'
        : 'not_connected'

  return {
    payoutStatus,
    detailsSubmitted,
    payoutsEnabled,
    disabledReason,
    pendingVerification: (account.requirements?.pending_verification?.length ?? 0) > 0,
  }
}

/**
 * Pulls the account's current state and writes `payout_status` back if it has
 * moved. Called when the seller returns from onboarding and again from the
 * `account.updated` webhook — the first is immediate feedback, the second
 * catches everything that happens later (a document rejected, a deadline
 * passed) without the seller having to visit anything.
 */
export async function syncPayoutStatus(
  seller: Seller,
  account?: Stripe.Account
): Promise<PayoutDetails> {
  if (!seller.stripeAccountId) {
    return {
      payoutStatus: 'not_connected',
      detailsSubmitted: false,
      payoutsEnabled: false,
      disabledReason: null,
      pendingVerification: false,
    }
  }

  const resolved = account ?? (await stripe.accounts.retrieve(seller.stripeAccountId))
  const details = payoutDetailsFor(resolved)

  if (seller.payoutStatus !== details.payoutStatus) {
    seller.payoutStatus = details.payoutStatus
    await seller.save()
  }

  return details
}
