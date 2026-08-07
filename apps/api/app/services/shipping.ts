import type ShippingProfile from '#models/shipping_profile'

/** Stands in for "anywhere without its own rate". */
export const ANY_DESTINATION = '*'

/**
 * Picks the rate that applies to a destination: an exact country match wins,
 * otherwise the catch-all. A profile with neither doesn't ship there, which
 * is different from shipping free.
 */
export function rateFor(profile: ShippingProfile, destinationCountry: string) {
  const country = destinationCountry.toUpperCase()

  return (
    profile.rates.find((rate) => rate.destination.toUpperCase() === country) ??
    profile.rates.find((rate) => rate.destination === ANY_DESTINATION) ??
    null
  )
}

/**
 * `first_item + (quantity - 1) x additional_item`, per profile.
 *
 * Postage isn't linear — three soaps go in one box — so a flat per-unit cost
 * would overcharge every multi-item order. Items sharing a profile are billed
 * as one consignment; separate profiles ("small parcel" and "large parcel")
 * are separate boxes and so add together.
 */
export function shippingCentsFor(
  lines: { profile: ShippingProfile | null; quantity: number }[],
  destinationCountry: string
): { cents: number; undeliverable: ShippingProfile[] } {
  const quantityByProfile = new Map<string, { profile: ShippingProfile; quantity: number }>()

  for (const line of lines) {
    // No profile means the seller ships it free — see the migration.
    if (!line.profile) continue

    const entry = quantityByProfile.get(line.profile.id)
    quantityByProfile.set(line.profile.id, {
      profile: line.profile,
      quantity: (entry?.quantity ?? 0) + line.quantity,
    })
  }

  let cents = 0
  const undeliverable: ShippingProfile[] = []

  for (const { profile, quantity } of quantityByProfile.values()) {
    const rate = rateFor(profile, destinationCountry)
    if (!rate) {
      undeliverable.push(profile)
      continue
    }

    cents += Number(rate.firstItemCents) + Number(rate.additionalItemCents) * (quantity - 1)
  }

  return { cents, undeliverable }
}
