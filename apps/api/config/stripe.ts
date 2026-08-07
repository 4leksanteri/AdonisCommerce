import env from '#start/env'
import Stripe from 'stripe'

/**
 * Pinning the API version means Stripe's own upgrades can't change responses
 * underneath us — the version moves when we choose to move it.
 */
export const stripe = new Stripe(env.get('STRIPE_SECRET_KEY').release(), {
  apiVersion: '2026-07-29.dahlia',
  appInfo: { name: env.get('APP_NAME') },
})

/** Basis points: 650 = 6.5%. */
export const PLATFORM_FEE_BPS = env.get('STRIPE_PLATFORM_FEE_BPS')

/**
 * The platform's cut, in the same minor units as the amount. Rounded down so
 * the fee can never exceed what was charged.
 */
export function platformFeeCents(amountCents: number): number {
  return Math.floor((amountCents * PLATFORM_FEE_BPS) / 10_000)
}
