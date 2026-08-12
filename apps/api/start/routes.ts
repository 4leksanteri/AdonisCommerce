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
// The curated taxonomy — same list for everyone, so no auth.
router.get('/api/categories', [controllers.Categories, 'index'])
router.get('/api/categories/:slug', [controllers.Categories, 'show'])
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
        // Closing the order out, or saying it went wrong. Keyed by reference
        // like the rest of the buyer's order routes.
        router.post('orders/:reference/confirm', [controllers.StorefrontOrders, 'confirmReceipt'])
        router.post('orders/:reference/problem', [controllers.StorefrontOrders, 'openDispute'])
        router.delete('orders/:reference/problem', [
          controllers.StorefrontOrders,
          'withdrawDispute',
        ])
        router.post('reviews', [controllers.Reviews, 'store'])
        router.patch('reviews/:id', [controllers.Reviews, 'update'])
      })
      .use(middleware.auth())
    router.get('products', [controllers.StorefrontProducts, 'index'])
    router.get('shops/:shopSlug', [controllers.StorefrontShops, 'show'])
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

/**
 * Someone's own account. Separate from `/api/auth`, which is about proving
 * who you are rather than editing who you are — reading `/api/auth/me` is
 * part of signing in, changing your name is not.
 */
router
  .group(() => {
    router.patch('profile', [controllers.Account, 'updateProfile'])
    router.patch('email', [controllers.Account, 'updateEmail'])
    router.patch('password', [controllers.Account, 'updatePassword'])
  })
  .prefix('/api/account')
  .as('account')
  .use(middleware.auth())

router
  .group(() => {
    router.post('/', [controllers.Sellers, 'store'])
    router.get('me', [controllers.Sellers, 'show'])
    router.patch('me', [controllers.Sellers, 'update'])
    router.post('me/avatar', [controllers.Sellers, 'uploadAvatar'])
    router.delete('me/avatar', [controllers.Sellers, 'removeAvatar'])

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

/**
 * The order conversation. Neither a seller nor a storefront resource — all
 * three roles reach the same thread — so it sits on its own rather than being
 * duplicated under both prefixes.
 */
router
  .group(() => {
    router.get('/:orderId', [controllers.OrderMessages, 'index'])
    router.post('/:orderId', [controllers.OrderMessages, 'store'])
  })
  .prefix('/api/order-messages')
  .as('orderMessages')
  .where('orderId', router.matchers.uuid())
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

/**
 * Staff tooling. `staff` runs behind `auth`, so there is always a user by the
 * time it checks; admins pass it too, since admin contains staff.
 */
router
  .group(() => {
    router.get('overview', [controllers.StaffOverview, 'show'])
    router.get('disputes', [controllers.StaffDisputes, 'index'])
    router.get('disputes/:id', [controllers.StaffDisputes, 'show'])
    // Verbs, because the two outcomes are different decisions about where
    // money ends up — not two values of one field.
    router.post('disputes/:id/refund', [controllers.StaffDisputes, 'refund'])
    router.post('disputes/:id/release', [controllers.StaffDisputes, 'release'])
  })
  .prefix('/api/staff')
  .as('staff')
  .where('id', router.matchers.uuid())
  .use([middleware.auth(), middleware.staff()])

/**
 * Admin tooling. `admin` runs behind `auth`; staff do not pass it, since
 * admin contains staff and not the other way round.
 */
router
  .group(() => {
    router.get('overview', [controllers.AdminOverview, 'show'])
    router.get('users', [controllers.AdminUsers, 'index'])
    router.patch('users/:id/role', [controllers.AdminUsers, 'setRole'])
    router.get('categories', [controllers.AdminCategories, 'index'])
    router.post('categories', [controllers.AdminCategories, 'store'])
    router.patch('categories/:id', [controllers.AdminCategories, 'update'])
  })
  .prefix('/api/admin')
  .as('admin')
  .where('id', router.matchers.uuid())
  .use([middleware.auth(), middleware.admin()])
