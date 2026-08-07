import type { HttpContext } from '@adonisjs/core/http'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import Seller from '#models/seller'
import ShippingProfile from '#models/shipping_profile'
import ShippingRate from '#models/shipping_rate'
import ShippingProfileTransformer from '#transformers/shipping_profile_transformer'
import { shippingProfileValidator } from '#validators/shipping_profile'

export default class ShippingProfilesController {
  private async sellerFor(userId: string) {
    return Seller.query().where('userId', userId).first()
  }

  async index({ auth, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth.getUserOrFail().id)
    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage shipping.' },
        ],
      })
    }

    const profiles = await ShippingProfile.query()
      .where('sellerId', seller.id)
      .orderBy('createdAt')
      .preload('rates', (query) => query.orderBy('destination'))

    return serialize(ShippingProfileTransformer.transform(profiles).depth(2))
  }

  async store({ request, auth, response, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth.getUserOrFail().id)
    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage shipping.' },
        ],
      })
    }

    const { name, rates } = await request.validateUsing(shippingProfileValidator)

    const profile = await db.transaction(async (trx) => {
      const created = new ShippingProfile()
      created.useTransaction(trx)
      created.sellerId = seller.id
      created.name = name
      await created.save()

      await this.replaceRates(trx, created, rates)
      return created
    })

    response.status(201)
    return serialize(await this.load(profile.id))
  }

  async update({ request, auth, response, params, serialize }: HttpContext) {
    const seller = await this.sellerFor(auth.getUserOrFail().id)
    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage shipping.' },
        ],
      })
    }

    const profile = await ShippingProfile.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!profile) {
      return response.notFound({
        errors: [{ code: 'SHIPPING_PROFILE_NOT_FOUND', message: 'Shipping profile not found.' }],
      })
    }

    const { name, rates } = await request.validateUsing(shippingProfileValidator)

    await db.transaction(async (trx) => {
      profile.useTransaction(trx)
      profile.name = name
      await profile.save()

      await this.replaceRates(trx, profile, rates)
    })

    return serialize(await this.load(profile.id))
  }

  async destroy({ auth, response, params }: HttpContext) {
    const seller = await this.sellerFor(auth.getUserOrFail().id)
    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage shipping.' },
        ],
      })
    }

    const profile = await ShippingProfile.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!profile) {
      return response.notFound({
        errors: [{ code: 'SHIPPING_PROFILE_NOT_FOUND', message: 'Shipping profile not found.' }],
      })
    }

    // Products referencing it fall back to free shipping rather than blocking
    // the delete — `products.shipping_profile_id` is ON DELETE SET NULL.
    await profile.delete()
    return response.noContent()
  }

  /**
   * Rates carry no references of their own, so replacing them wholesale is
   * safe here — unlike variants, nothing outside points at a rate id.
   */
  private async replaceRates(
    trx: TransactionClientContract,
    profile: ShippingProfile,
    rates: { destination: string; firstItemCents: number; additionalItemCents: number }[]
  ) {
    await ShippingRate.query({ client: trx }).where('shippingProfileId', profile.id).delete()

    for (const rate of rates) {
      const created = new ShippingRate()
      created.useTransaction(trx)
      created.shippingProfileId = profile.id
      created.destination = rate.destination === '*' ? '*' : rate.destination.toUpperCase()
      created.firstItemCents = rate.firstItemCents
      created.additionalItemCents = rate.additionalItemCents
      await created.save()
    }
  }

  private async load(id: string) {
    const profile = await ShippingProfile.query()
      .where('id', id)
      .preload('rates', (query) => query.orderBy('destination'))
      .firstOrFail()

    return ShippingProfileTransformer.transform(profile).depth(2)
  }
}
