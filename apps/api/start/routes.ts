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
