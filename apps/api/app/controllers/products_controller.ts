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
   * form rebuilds them in the order the seller arranged them. Variants are
   * ordered by `createdAt` explicitly — an unordered query returns them in
   * heap order, so updating one variant's stock reshuffles the whole list.
   */
  private productQuery() {
    return Product.query()
      .preload('options', (query) =>
        query.orderBy('position').preload('values', (values) => values.orderBy('position'))
      )
      .preload('variants', (query) => query.orderBy('createdAt').preload('optionValues'))
      .preload('images', (query) => query.orderBy('position'))
  }

  /**
   * Brings a product's options and variants in line with the submitted shape,
   * matching existing rows instead of recreating them.
   *
   * Ids have to survive an edit. Carts store variant ids, and orders will too
   * — wiping and recreating meant a seller correcting a typo silently emptied
   * every cart holding that product. Options match on name, values on their
   * string within an option, and variants on the *set* of option values they
   * carry, so editing a price or restocking leaves every id untouched. Only a
   * genuine rename or a new combination mints a new row.
   */
  private async syncOptionsAndVariants(
    trx: TransactionClientContract,
    product: Product,
    options: ProductInput['options'],
    variants: ProductInput['variants']
  ) {
    const existingOptions = await ProductOption.query({ client: trx })
      .where('productId', product.id)
      .preload('values')

    // Keyed by "optionName:value" so variants below can resolve the row id
    // they need to attach, without a second round-trip per lookup.
    const valuesByKey = new Map<string, ProductOptionValue>()
    const keptOptionIds: string[] = []

    for (const [index, option] of (options ?? []).entries()) {
      let productOption = existingOptions.find((candidate) => candidate.name === option.name)

      if (productOption) {
        productOption.useTransaction(trx)
        productOption.position = index
        await productOption.save()
      } else {
        productOption = new ProductOption()
        productOption.useTransaction(trx)
        productOption.productId = product.id
        productOption.name = option.name
        productOption.position = index
        await productOption.save()
      }
      keptOptionIds.push(productOption.id)

      const keptValueIds: string[] = []
      for (const [valueIndex, value] of option.values.entries()) {
        let optionValue = productOption.values?.find((candidate) => candidate.value === value)

        if (optionValue) {
          optionValue.useTransaction(trx)
          optionValue.position = valueIndex
          await optionValue.save()
        } else {
          optionValue = new ProductOptionValue()
          optionValue.useTransaction(trx)
          optionValue.productOptionId = productOption.id
          optionValue.value = value
          optionValue.position = valueIndex
          await optionValue.save()
        }

        keptValueIds.push(optionValue.id)
        valuesByKey.set(`${option.name}:${value}`, optionValue)
      }

      // Values the seller removed. Cascades their pivot rows, which in turn
      // orphans any variant built on them — cleaned up below.
      await ProductOptionValue.query({ client: trx })
        .where('productOptionId', productOption.id)
        .whereNotIn('id', keptValueIds.length > 0 ? keptValueIds : [''])
        .delete()
    }

    await ProductOption.query({ client: trx })
      .where('productId', product.id)
      .whereNotIn('id', keptOptionIds.length > 0 ? keptOptionIds : [''])
      .delete()

    const existingVariants = await ProductVariant.query({ client: trx })
      .where('productId', product.id)
      .preload('optionValues')

    /** A variant is identified by the set of option-value ids it carries. */
    const signature = (valueIds: string[]) => [...valueIds].sort().join('|')

    const existingBySignature = new Map(
      existingVariants.map((variant) => [
        signature(variant.optionValues.map((optionValue) => optionValue.id)),
        variant,
      ])
    )

    const keptVariantIds: string[] = []

    for (const variant of variants) {
      const valueIds = (variant.optionValues ?? []).map((value, index) => {
        const optionName = options?.[index]?.name
        const found = optionName && valuesByKey.get(`${optionName}:${value}`)
        if (!found) {
          throw new Error(`Unknown option value "${value}" at position ${index}`)
        }
        return found.id
      })

      const existing = existingBySignature.get(signature(valueIds))
      const productVariant = existing ?? new ProductVariant()
      productVariant.useTransaction(trx)
      productVariant.productId = product.id
      productVariant.sku = variant.sku ?? null
      productVariant.priceCents = variant.priceCents
      productVariant.stockQuantity = variant.stockQuantity
      await productVariant.save()

      if (!existing && valueIds.length > 0) {
        await productVariant.related('optionValues').attach(valueIds, trx)
      }

      keptVariantIds.push(productVariant.id)
    }

    // Combinations the seller excluded, or that lost an option value above.
    await ProductVariant.query({ client: trx })
      .where('productId', product.id)
      .whereNotIn('id', keptVariantIds.length > 0 ? keptVariantIds : [''])
      .delete()
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

    const { title, description, currency, tracksInventory, options, variants } =
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
      newProduct.tracksInventory = tracksInventory ?? true
      await newProduct.save()

      await this.syncOptionsAndVariants(trx, newProduct, options, variants)

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
   * product. Options and variants are matched and updated in place rather
   * than recreated, so their ids survive an edit — carts reference them.
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

    const { title, description, status, currency, tracksInventory, options, variants } =
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
      product.tracksInventory = tracksInventory ?? product.tracksInventory
      await product.save()

      await this.syncOptionsAndVariants(trx, product, options, variants)
    })

    return serialize(
      ProductTransformer.transform(await this.productQuery().where('id', product.id).firstOrFail())
    )
  }
}
