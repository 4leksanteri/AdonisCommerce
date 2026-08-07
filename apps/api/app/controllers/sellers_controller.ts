import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import Seller from '#models/seller'
import SellerTransformer from '#transformers/seller_transformer'
import SellerApprovedNotification from '#mails/seller_approved_notification'
import { becomeSellerValidator } from '#validators/seller'

export default class SellersController {
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { shopName, description } = await request.validateUsing(becomeSellerValidator)

    const existing = await Seller.query().where('userId', user.id).first()
    if (existing) {
      return response.badRequest({
        errors: [
          { code: 'SELLER_ALREADY_EXISTS', message: 'You already have a seller account.' },
        ],
      })
    }

    const seller = await Seller.applyFor(user, { shopName, description: description ?? null })

    if (seller.status === 'approved') {
      await mail.send(new SellerApprovedNotification(user, seller))
    }

    return serialize(SellerTransformer.transform(seller))
  }

  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return { data: null }
    }

    return serialize(SellerTransformer.transform(seller))
  }

  async update({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { shopName, description, currency, country } =
      await request.validateUsing(becomeSellerValidator)

    const seller = await Seller.query().where('userId', user.id).firstOrFail()
    seller.shopName = shopName
    seller.description = description ?? null
    seller.currency = currency ?? seller.currency
    seller.country = country?.toUpperCase() ?? seller.country
    await seller.save()

    return serialize(SellerTransformer.transform(seller))
  }
}
