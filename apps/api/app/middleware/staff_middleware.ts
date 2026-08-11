import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Gates the staff tooling. Runs after `auth`, so there is always a user by
 * this point — the only question is whether they are allowed in.
 *
 * Asks the model's named ability rather than comparing `role`, so the day a
 * role stops nesting inside `admin` this keeps working untouched.
 *
 * Answers 404, not 403: a customer poking at `/api/staff/...` should learn
 * nothing about what lives there.
 */
export default class StaffMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.auth.getUserOrFail().canAccessStaffPanel) {
      return ctx.response.notFound({
        errors: [{ code: 'NOT_FOUND', message: 'Not found.' }],
      })
    }

    return next()
  }
}
