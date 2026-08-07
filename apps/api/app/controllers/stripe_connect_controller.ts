import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Seller from '#models/seller'
import { PLATFORM_FEE_BPS } from '#config/stripe'
import {
  dashboardLink,
  ensureConnectAccount,
  onboardingLink,
  syncPayoutStatus,
} from '#services/stripe_connect'

const localeValidator = vine.create({
  locale: vine.enum(['en', 'fi']).optional(),
})

/**
 * The seller's side of Stripe Connect. Onboarding, identity documents and the
 * payout schedule all live on Stripe's hosted pages — this controller only
 * mints links to them and keeps `payout_status` in step.
 */
export default class StripeConnectController {
  /**
   * Reads the account's live state rather than trusting our stored copy:
   * Stripe can restrict an account at any time, and the seller panel showing
   * "connected" while payouts are frozen would be worse than showing nothing.
   */
  async show({ auth, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const details = await syncPayoutStatus(seller)

    return serialize({
      ...details,
      hasAccount: seller.stripeAccountId !== null,
      // The seller should be able to read the commission off the same page
      // that explains what they get paid.
      platformFeeBps: PLATFORM_FEE_BPS,
    })
  }

  /**
   * Starts (or resumes) hosted onboarding. Account Links are single-use and
   * expire within minutes, so a fresh one is minted per request instead of
   * being cached anywhere.
   */
  async onboarding({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    const { locale } = await request.validateUsing(localeValidator)

    const accountId = await ensureConnectAccount(seller, user)
    const details = await syncPayoutStatus(seller)

    // Someone who has already submitted their details is coming back to fix
    // or update something, which is a different Stripe flow.
    const url = await onboardingLink(accountId, locale ?? 'en', details.detailsSubmitted)

    return serialize({ url })
  }

  /** One-time sign-in to the Express dashboard, where Stripe shows payouts. */
  async dashboard({ auth, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth)
    if (!seller) return this.notASeller(response)

    if (!seller.stripeAccountId) {
      return response.badRequest({
        errors: [{ code: 'PAYOUTS_NOT_CONNECTED', message: 'Connect a payout account first.' }],
      })
    }

    const url = await dashboardLink(seller.stripeAccountId)

    return serialize({ url })
  }

  private sellerFor(auth: HttpContext['auth']) {
    return Seller.query().where('userId', auth.getUserOrFail().id).first()
  }

  private notASeller(response: HttpContext['response']) {
    return response.forbidden({
      errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account.' }],
    })
  }
}
