import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import sharp from 'sharp'
import Seller from '#models/seller'
import Product from '#models/product'
import ProductImage from '#models/product_image'
import ProductImageTransformer from '#transformers/product_image_transformer'

export default class ProductImagesController {
  async store({ request, auth, response, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage products.' },
        ],
      })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!product) {
      return response.notFound({
        errors: [{ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' }],
      })
    }

    const files = request.files('images', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (files.length === 0) {
      return response.badRequest({
        errors: [{ code: 'NO_FILES', message: 'No images were uploaded.' }],
      })
    }

    for (const file of files) {
      if (!file.isValid) {
        return response.badRequest({
          errors: file.errors.map((error) => ({ code: 'INVALID_FILE', message: error.message })),
        })
      }
    }

    const lastImage = await ProductImage.query()
      .where('productId', product.id)
      .orderBy('position', 'desc')
      .first()
    let position = (lastImage?.position ?? -1) + 1

    const images: ProductImage[] = []
    for (const file of files) {
      const filename = `${randomUUID()}.webp`
      // Re-encode to webp on the way in — smaller files and one consistent
      // format to serve, regardless of what the seller uploaded.
      await sharp(file.tmpPath)
        .webp({ quality: 80 })
        .toFile(app.makePath('storage/uploads', filename))
      images.push(
        await ProductImage.create({
          productId: product.id,
          path: filename,
          position: position++,
        })
      )
    }

    return serialize(ProductImageTransformer.transform(images))
  }

  async destroy({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to manage products.' },
        ],
      })
    }

    // Joined through the product so a seller can only ever reach their own
    // images, whatever product id they pair the image id with.
    const image = await ProductImage.query()
      .where('id', params.imageId)
      .whereHas('product', (query) => query.where('id', params.id).where('sellerId', seller.id))
      .first()

    if (!image) {
      return response.notFound({
        errors: [{ code: 'PRODUCT_IMAGE_NOT_FOUND', message: 'Image not found.' }],
      })
    }

    await image.delete()
    // Best-effort — the row is already gone, and a leftover file is far less
    // harmful than failing a delete the seller has been told succeeded.
    await unlink(app.makePath('storage/uploads', image.path)).catch(() => {})

    return response.noContent()
  }
}
