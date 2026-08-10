/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/api/translations/:locale', [controllers.Translations, 'show'])
router.get('/uploads/:filename', [controllers.Uploads, 'show'])

// Unauthenticated by design — the caller is Stripe, not a signed-in user, and
// the request's own signature is what proves it.
router.post('/api/stripe/webhook', [controllers.StripeWebhook, 'handle'])

// Storefront — unauthenticated, so every handler filters down to what a
// shopper is allowed to see (active products, approved shops).
router
  .group(() => {
    router.get('exchange-rates', [controllers.ExchangeRates, 'index'])
    router.post('cart', [controllers.Cart, 'hydrate'])

    // Placing and reading orders needs a signed-in buyer; guest checkout is
    // a later job.
    router
      .group(() => {
        router.post('orders', [controllers.StorefrontOrders, 'store'])
        router.get('orders', [controllers.StorefrontOrders, 'index'])
        router.get('orders/:reference', [controllers.StorefrontOrders, 'show'])
      })
      .use(middleware.auth())
    router.get('products', [controllers.StorefrontProducts, 'index'])
    router.get('shops/:shopSlug/products/:productSlug', [controllers.StorefrontProducts, 'show'])
  })
  .prefix('/api/storefront')
  .as('storefront')

router
  .group(() => {
    router.post('register', [controllers.RegisteredUser, 'store'])
    router.post('login', [controllers.AccessTokens, 'store'])
    router.post('forgot-password', [controllers.PasswordResetLink, 'store'])
    router.post('reset-password', [controllers.NewPassword, 'store'])

    router
      .group(() => {
        router.get('me', [controllers.AccessTokens, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/auth')
  .as('auth')

router
  .group(() => {
    router.post('/', [controllers.Sellers, 'store'])
    router.get('me', [controllers.Sellers, 'show'])
    router.patch('me', [controllers.Sellers, 'update'])

    // Payouts live on Stripe; these only mint links into it and report back
    // whatever Stripe currently says about the account.
    router.get('me/payouts', [controllers.StripeConnect, 'show'])
    router.post('me/payouts/onboarding', [controllers.StripeConnect, 'onboarding'])
    router.post('me/payouts/dashboard', [controllers.StripeConnect, 'dashboard'])
  })
  .prefix('/api/sellers')
  .as('sellers')
  .use(middleware.auth())

// The seller's own orders. Mirrors products: the bare path is the seller's
// view of a resource, the `/api/storefront` one is the shopper's.
router
  .group(() => {
    router.get('/', [controllers.Orders, 'index'])
    router.get('/:id', [controllers.Orders, 'show'])
    // Verbs rather than a PATCH on `status`: each one is a different piece of
    // work — accepting is a promise, shipping records a dispatch, cancelling
    // moves money — and none is interchangeable with the others.
    router.post('/:id/accept', [controllers.Orders, 'accept'])
    router.post('/:id/ship', [controllers.Orders, 'ship'])
    router.post('/:id/cancel', [controllers.Orders, 'cancel'])
  })
  .prefix('/api/orders')
  .as('orders')
  .where('id', router.matchers.uuid())
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [controllers.ShippingProfiles, 'index'])
    router.post('/', [controllers.ShippingProfiles, 'store'])
    router.patch('/:id', [controllers.ShippingProfiles, 'update'])
    router.delete('/:id', [controllers.ShippingProfiles, 'destroy'])
  })
  .prefix('/api/shipping-profiles')
  .as('shippingProfiles')
  .where('id', router.matchers.uuid())
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [controllers.Products, 'index'])
    router.post('/', [controllers.Products, 'store'])
    router.post('/draft', [controllers.Products, 'storeDraft'])
    router.get('/:id', [controllers.Products, 'show'])
    router.patch('/:id', [controllers.Products, 'update'])
    router.post('/:id/images', [controllers.ProductImages, 'store'])
    router.delete('/:id/images/:imageId', [controllers.ProductImages, 'destroy'])
  })
  .prefix('/api/products')
  .as('products')
  // Ids reach these routes straight from user-typed URLs on the frontend.
  // Matching the uuid shape turns a junk id into a 404 at the router, instead
  // of Postgres blowing up on `where id = 'abc'` further down.
  .where('id', router.matchers.uuid())
  .where('imageId', router.matchers.uuid())
  .use(middleware.auth())
