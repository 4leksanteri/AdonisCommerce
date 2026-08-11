import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import mail from '@adonisjs/mail/services/main'
import sharp from 'sharp'
import Seller from '#models/seller'
import SellerTransformer from '#transformers/seller_transformer'
import SellerApprovedNotification from '#mails/seller_approved_notification'
import { becomeSellerValidator } from '#validators/seller'

/**
 * Resized on the way in, unlike product images, which are re-encoded at
 * whatever dimensions the seller's phone produced. An avatar renders at
 * 32–80px and nothing is gained by storing four thousand.
 *
 * `cover` rather than `contain`: the frame is a circle, so letterboxing would
 * show as bars inside it.
 */
const AVATAR_SIZE = 256

export default class SellersController {
  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { shopName, description } = await request.validateUsing(becomeSellerValidator)

    const existing = await Seller.query().where('userId', user.id).first()
    if (existing) {
      return response.badRequest({
        errors: [{ code: 'SELLER_ALREADY_EXISTS', message: 'You already have a seller account.' }],
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

  /**
   * The shop picture. A separate route from `update` because it is multipart
   * and saves on its own — nobody expects to press Save after choosing a
   * photo — but it is still just a field on the seller, which is why it lives
   * here rather than in a controller of its own.
   */
  async uploadAvatar({ request, auth, response, serialize }: HttpContext) {
    const seller = await this.ownShop(auth)
    if (!seller) return this.notASeller(response)

    const file = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!file) {
      return response.badRequest({
        errors: [{ code: 'NO_FILES', message: 'No image was uploaded.' }],
      })
    }

    if (!file.isValid) {
      return response.badRequest({
        errors: file.errors.map((error) => ({ code: 'INVALID_FILE', message: error.message })),
      })
    }

    const previous = seller.avatarPath
    const filename = `${randomUUID()}.webp`

    await sharp(file.tmpPath)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(app.makePath('storage/uploads', filename))

    seller.avatarPath = filename
    await seller.save()

    // Written under a new name first, so a failure part-way leaves the old
    // picture in place rather than a shop with none.
    if (previous) await this.removeAvatarFile(previous)

    return serialize(SellerTransformer.transform(seller))
  }

  async removeAvatar({ auth, response, serialize }: HttpContext) {
    const seller = await this.ownShop(auth)
    if (!seller) return this.notASeller(response)

    const previous = seller.avatarPath
    seller.avatarPath = null
    await seller.save()

    if (previous) await this.removeAvatarFile(previous)

    return serialize(SellerTransformer.transform(seller))
  }

  /**
   * Best-effort, and deliberately after the row is saved: a leftover file
   * costs disk, whereas a row pointing at a file that is gone renders a
   * broken image everywhere the shop appears.
   */
  private async removeAvatarFile(path: string) {
    await unlink(app.makePath('storage/uploads', path)).catch(() => {})
  }

  private ownShop(auth: HttpContext['auth']) {
    return Seller.query().where('userId', auth.getUserOrFail().id).first()
  }

  private notASeller(response: HttpContext['response']) {
    return response.forbidden({
      errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account.' }],
    })
  }
}
