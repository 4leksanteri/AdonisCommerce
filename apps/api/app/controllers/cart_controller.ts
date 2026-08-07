import type { HttpContext } from '@adonisjs/core/http'
import ProductVariant from '#models/product_variant'
import { hydrateCartValidator } from '#validators/cart'

export default class CartController {
  /**
   * Turns the client's `{ variantId, quantity }` list into current line data.
   *
   * The browser stores only ids and quantities, never prices — so this is
   * where a cart learns that something got more expensive, went out of stock
   * or was delisted since it was added. Anything no longer purchasable is
   * simply absent from the response, and the client shows those lines as
   * unavailable rather than silently dropping them.
   *
   * A POST because it takes a list of ids in the body; it reads rather than
   * writes, since the cart itself lives in the browser until checkout.
   */
  async hydrate({ request, response }: HttpContext) {
    const { items } = await request.validateUsing(hydrateCartValidator)

    if (items.length === 0) {
      return response.ok({ data: [] })
    }

    const variants = await ProductVariant.query()
      .whereIn(
        'id',
        items.map((item) => item.variantId)
      )
      .whereHas('product', (product) =>
        product
          .where('status', 'active')
          .whereHas('seller', (seller) => seller.where('status', 'approved'))
      )
      .preload('optionValues', (query) => query.preload('option'))
      .preload('product', (product) => {
        product.preload('seller')
        product.preload('images', (images) => images.orderBy('position').limit(1))
        product.preload('shippingProfile', (profile) => profile.preload('rates'))
      })

    const lines = variants.map((variant) => {
      const { product } = variant
      const image = product.images.at(0)

      return {
        variantId: variant.id,
        productTitle: product.title,
        productSlug: product.slug,
        shopName: product.seller.shopName,
        shopSlug: product.seller.slug,
        currency: product.currency,
        tracksInventory: product.tracksInventory,
        imageUrl: image ? `/uploads/${image.path}` : null,
        priceCents: Number(variant.priceCents),
        stockQuantity: variant.stockQuantity,
        // Grouped on by the cart: items sharing a profile ship as one parcel,
        // so the client needs the identity as well as the rates.
        shippingProfileId: product.shippingProfileId,
        shippingRates: (product.shippingProfile?.rates ?? []).map((rate) => ({
          destination: rate.destination,
          firstItemCents: Number(rate.firstItemCents),
          additionalItemCents: Number(rate.additionalItemCents),
        })),
        // Ordered by the option each value belongs to, so a line always reads
        // "Lavender / Small" rather than flipping between renders.
        optionValues: [...variant.optionValues]
          .sort((a, b) => a.option.position - b.option.position)
          .map((optionValue) => optionValue.value),
      }
    })

    return response.ok({ data: lines })
  }
}
