import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Gates the admin tooling. Runs after `auth`, and asks the model's named
 * ability rather than comparing `role` — see the User model for why.
 *
 * 404 like the staff guard: a customer poking at `/api/admin/...` should
 * learn nothing about what lives there.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.auth.getUserOrFail().canAccessAdminPanel) {
      return ctx.response.notFound({
        errors: [{ code: 'NOT_FOUND', message: 'Not found.' }],
      })
    }

    return next()
  }
}
