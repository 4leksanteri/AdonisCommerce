import type { HttpContext } from '@adonisjs/core/http'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import Seller from '#models/seller'
import Product from '#models/product'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'
import ProductTransformer from '#transformers/product_transformer'
import { createProductValidator } from '#validators/product'

type ProductInput = Awaited<ReturnType<typeof createProductValidator.validate>>

export default class ProductsController {
  /**
   * Base query with every relation the transformer needs preloaded. Options,
   * their values and images are ordered by `position` so the seller-facing
   * form rebuilds them in the order the seller arranged them; variants keep
   * insertion order, which is the option-combination order they were built in.
   */
  private productQuery() {
    return Product.query()
      .preload('options', (query) =>
        query.orderBy('position').preload('values', (values) => values.orderBy('position'))
      )
      .preload('variants', (query) => query.preload('optionValues'))
      .preload('images', (query) => query.orderBy('position'))
  }

  /**
   * Recreates a product's options/variants from scratch inside `trx`. Used
   * by both `store` (fresh product) and `update` (finalizing a draft) —
   * `update` deletes the existing rows first, so this always starts clean.
   */
  private async replaceOptionsAndVariants(
    trx: TransactionClientContract,
    product: Product,
    options: ProductInput['options'],
    variants: ProductInput['variants']
  ) {
    // Keyed by "optionName:value" so variants below can resolve the row id
    // they need to attach, without a second round-trip per lookup.
    const valuesByKey = new Map<string, ProductOptionValue>()

    for (const [index, option] of (options ?? []).entries()) {
      const productOption = new ProductOption()
      productOption.useTransaction(trx)
      productOption.productId = product.id
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
      productVariant.productId = product.id
      productVariant.sku = variant.sku ?? null
      productVariant.priceCents = variant.priceCents
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
  }

  async index({ auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account to view products.' }],
      })
    }

    const products = await this.productQuery()
      .where('sellerId', seller.id)
      .orderBy('createdAt', 'desc')

    return serialize(ProductTransformer.transform(products))
  }

  async show({ auth, response, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account to view products.' }],
      })
    }

    const product = await this.productQuery()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!product) {
      return response.notFound({
        errors: [{ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' }],
      })
    }

    return serialize(ProductTransformer.transform(product))
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

    const { title, description, currency, options, variants } =
      await request.validateUsing(createProductValidator)
    const slug = await Product.generateUniqueSlug(seller.id, title)

    const product = await db.transaction(async (trx) => {
      const newProduct = new Product()
      newProduct.useTransaction(trx)
      newProduct.sellerId = seller.id
      newProduct.title = title
      newProduct.description = description ?? null
      newProduct.status = 'active'
      newProduct.slug = slug
      // Inherits the shop's currency unless the seller names one explicitly.
      newProduct.currency = currency ?? seller.currency
      await newProduct.save()

      await this.replaceOptionsAndVariants(trx, newProduct, options, variants)

      return newProduct
    })

    return serialize(
      ProductTransformer.transform(await this.productQuery().where('id', product.id).firstOrFail())
    )
  }

  /**
   * Creates a bare draft product with no options/variants — just enough of
   * a row to attach images to before the seller has filled in the rest of
   * the form. Finalized later via `update`.
   */
  async storeDraft({ auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [
          { code: 'NOT_A_SELLER', message: 'You need a seller account to create products.' },
        ],
      })
    }

    const slug = await Product.generateUniqueSlug(seller.id, 'Untitled product')
    const product = await Product.create({
      sellerId: seller.id,
      title: 'Untitled product',
      description: null,
      status: 'draft',
      slug,
      currency: seller.currency,
    })

    return serialize(
      ProductTransformer.transform(await this.productQuery().where('id', product.id).firstOrFail())
    )
  }

  /**
   * Finalizes a product — used both to flesh out a draft created via
   * `storeDraft` (once images are attached) and to edit an already-active
   * product. Options/variants are wiped and recreated from scratch rather
   * than diffed, since there's no partial-edit UI yet.
   *
   * Omitting `status` publishes the product, which is what the create flow
   * wants when it finalizes its draft. The edit form always sends the
   * seller's current choice, so an archived product stays archived.
   */
  async update({ request, auth, response, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const seller = await Seller.query().where('userId', user.id).first()

    if (!seller) {
      return response.forbidden({
        errors: [{ code: 'NOT_A_SELLER', message: 'You need a seller account to edit products.' }],
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

    const { title, description, status, currency, options, variants } =
      await request.validateUsing(createProductValidator)
    // Only re-slug when the title actually moved. Regenerating unconditionally
    // would bump an unchanged title to `-2` (its own row counts as a clash)
    // and churn the product's public URL on every save.
    const slug =
      product.title === title
        ? product.slug
        : await Product.generateUniqueSlug(seller.id, title, product.id)

    await db.transaction(async (trx) => {
      product.useTransaction(trx)
      product.title = title
      product.description = description ?? null
      product.status = status ?? 'active'
      product.slug = slug
      product.currency = currency ?? product.currency
      await product.save()

      // Cascades delete each option's values and each variant's pivot rows.
      await ProductOption.query({ client: trx }).where('productId', product.id).delete()
      await ProductVariant.query({ client: trx }).where('productId', product.id).delete()

      await this.replaceOptionsAndVariants(trx, product, options, variants)
    })

    return serialize(
      ProductTransformer.transform(await this.productQuery().where('id', product.id).firstOrFail())
    )
  }
}
