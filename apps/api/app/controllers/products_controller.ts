import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Seller from '#models/seller'
import Product from '#models/product'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'
import ProductTransformer from '#transformers/product_transformer'
import { createProductValidator } from '#validators/product'

export default class ProductsController {
  async index({ auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account to view products.' }],
      })
    }

    const products = await Product.query()
      .where('sellerId', seller.id)
      .orderBy('createdAt', 'desc')
      .preload('options', (query) => query.preload('values'))
      .preload('variants', (query) => query.preload('optionValues'))

    return serialize(ProductTransformer.transform(products))
  }

  async store({ request, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to create products.' },
        ],
      })
    }

    const { title, description, options, variants } =
      await request.validateUsing(createProductValidator)
    const slug = await Product.generateUniqueSlug(title)

    const product = await db.transaction(async (trx) => {
      const newProduct = new Product()
      newProduct.useTransaction(trx)
      newProduct.sellerId = seller.id
      newProduct.title = title
      newProduct.description = description ?? null
      newProduct.status = 'draft'
      newProduct.slug = slug
      await newProduct.save()

      // Keyed by "optionName:value" so variants below can resolve the row
      // id they need to attach, without a second round-trip per lookup.
      const valuesByKey = new Map<string, ProductOptionValue>()

      for (const [index, option] of (options ?? []).entries()) {
        const productOption = new ProductOption()
        productOption.useTransaction(trx)
        productOption.productId = newProduct.id
        productOption.name = option.name
        productOption.position = index
        await productOption.save()

        for (const [valueIndex, value] of option.values.entries()) {
          const optionValue = new ProductOptionValue()
          optionValue.useTransaction(trx)
          optionValue.productOptionId = productOption.id
          optionValue.value = value
          optionValue.position = valueIndex
          await optionValue.save()
          valuesByKey.set(`${option.name}:${value}`, optionValue)
        }
      }

      for (const variant of variants) {
        const productVariant = new ProductVariant()
        productVariant.useTransaction(trx)
        productVariant.productId = newProduct.id
        productVariant.sku = variant.sku ?? null
        productVariant.price = String(variant.price)
        productVariant.stockQuantity = variant.stockQuantity
        await productVariant.save()

        const valueIds = (variant.optionValues ?? []).map((value, index) => {
          const optionName = options?.[index]?.name
          const found = optionName && valuesByKey.get(`${optionName}:${value}`)
          if (!found) {
            throw new Error(`Unknown option value "${value}" at position ${index}`)
          }
          return found.id
        })

        if (valueIds.length > 0) {
          await productVariant.related('optionValues').attach(valueIds, trx)
        }
      }

      return newProduct
    })

    await product.load((preloader) =>
      preloader
        .load('options', (query) => query.preload('values'))
        .load('variants', (query) => query.preload('optionValues'))
    )

    return serialize(ProductTransformer.transform(product))
  }
}
