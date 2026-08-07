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

// Storefront — unauthenticated, so every handler filters down to what a
// shopper is allowed to see (active products, approved shops).
router
  .group(() => {
    router.get('exchange-rates', [controllers.ExchangeRates, 'index'])
    router.post('cart', [controllers.Cart, 'hydrate'])
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
  })
  .prefix('/api/sellers')
  .as('sellers')
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
