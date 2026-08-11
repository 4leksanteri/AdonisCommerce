import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import User, { USER_ROLES } from '#models/user'
import AdminUserTransformer from '#transformers/admin_user_transformer'

const setRoleValidator = vine.create({
  role: vine.enum(USER_ROLES),
})

const PER_PAGE = 25

export default class AdminUsersController {
  async index({ request, serialize }: HttpContext) {
    const search = String(request.input('search', '')).trim()
    const role = request.input('role') as string | undefined
    const page = Number(request.input('page', 1)) || 1

    const users = await User.query()
      .if(search !== '', (query) =>
        query.where((match) =>
          match.whereILike('email', `%${search}%`).orWhereILike('full_name', `%${search}%`)
        )
      )
      .if(role !== undefined && role !== 'all', (query) => query.where('role', role!))
      .preload('seller')
      .preload('roleChangedBy')
      .orderBy('createdAt', 'desc')
      .paginate(page, PER_PAGE)

    return serialize(AdminUserTransformer.paginate(users.all(), users.getMeta()))
  }

  /**
   * Grants or revokes staff and admin access.
   *
   * Possible from a screen rather than only from a shell, because requiring
   * shell access to appoint a colleague doesn't survive a second person. The
   * safeguards are that only admins get here, the change is attributed, and
   * the guard below makes it impossible to lock yourself out.
   */
  async setRole({ params, request, auth, response, serialize }: HttpContext) {
    const actor = auth.getUserOrFail()
    const { role } = await request.validateUsing(setRoleValidator)

    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ errors: [{ code: 'USER_NOT_FOUND', message: 'User not found.' }] })
    }

    /**
     * Nobody may drop their own admin rights. There is no other way back in —
     * the screen that would fix it is the one they just locked themselves out
     * of — so the recovery is shell access, and that is a bad afternoon.
     */
    if (user.id === actor.id && role !== 'admin') {
      return response.conflict({
        errors: [
          {
            code: 'CANNOT_DEMOTE_SELF',
            message: 'You cannot remove your own admin access.',
          },
        ],
      })
    }

    if (user.role !== role) {
      user.role = role
      user.roleChangedByUserId = actor.id
      user.roleChangedAt = DateTime.now()
      await user.save()
    }

    await user.load((preloader) => preloader.load('seller').load('roleChangedBy'))

    return serialize(AdminUserTransformer.transform(user))
  }
}
