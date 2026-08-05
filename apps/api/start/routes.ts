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
  })
  .prefix('/api/products')
  .as('products')
  .use(middleware.auth())
