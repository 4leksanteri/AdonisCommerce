import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import {
  closeAccountValidator,
  updateEmailValidator,
  updatePasswordValidator,
  updateProfileValidator,
} from '#validators/user'
import UserTransformer from '#transformers/user_transformer'
import { notifyEmailChanged, notifyPasswordChanged } from '#services/account_notifications'
import { blockerFor, closeAccount } from '#services/account_closure'

/**
 * What someone can change about their own account.
 *
 * Split into three endpoints rather than one PATCH because they are not the
 * same kind of change: a display name is a preference, an email address is
 * the login identity, and a password is the credential itself. The last two
 * ask for the current password; the first does not.
 */
export default class AccountController {
  async updateProfile({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { fullName, locale } = await request.validateUsing(updateProfileValidator)

    user.fullName = fullName
    user.locale = locale
    await user.save()

    return serialize(UserTransformer.transform(await this.withSeller(user)))
  }

  async updateEmail({ request, response, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { email, currentPassword } = await request.validateUsing(updateEmailValidator, {
      meta: { userId: user.id },
    })

    if (!(await this.passwordMatches(user, currentPassword))) {
      return this.wrongPassword(response)
    }

    // Captured before the write: the warning goes where the account used to
    // be reachable, which is the only address the rightful owner still has.
    const previousEmail = user.email

    user.email = email
    await user.save()

    await notifyEmailChanged(user, previousEmail)

    /**
     * Other sessions are left alone on purpose. Reaching this point already
     * required the password, so there is nothing to lock out — and signing
     * someone out of their phone for fixing a typo is a punishment, not a
     * safeguard. A password change is the one that revokes.
     */
    return serialize(UserTransformer.transform(await this.withSeller(user)))
  }

  async updatePassword({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword, password } = await request.validateUsing(updatePasswordValidator)

    if (!(await this.passwordMatches(user, currentPassword))) {
      return this.wrongPassword(response)
    }

    user.password = password
    await user.save()

    /**
     * Every other session dies with the old password. Changing it is what
     * someone does when they think a device or a browser is no longer theirs
     * to trust, and leaving those sessions signed in would make the act
     * pointless. The current one survives, so the person doing it stays put.
     */
    const tokens = await User.accessTokens.all(user)
    await Promise.all(
      tokens
        .filter((token) => token.identifier !== user.currentAccessToken?.identifier)
        .map((token) => User.accessTokens.delete(user, token.identifier))
    )

    await notifyPasswordChanged(user)

    return { code: 'PASSWORD_UPDATED', message: 'Password updated.' }
  }

  /**
   * Closing an account. Anonymises rather than deletes — see the service and
   * the docblock on the User model for why the row has to stay.
   */
  async destroy({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword } = await request.validateUsing(closeAccountValidator)

    if (!(await this.passwordMatches(user, currentPassword))) {
      return this.wrongPassword(response)
    }

    const blocker = await blockerFor(user)
    if (blocker) {
      return response.conflict({
        errors: [{ code: blocker, message: 'This account cannot be closed yet.' }],
      })
    }

    await closeAccount(user)

    return { code: 'ACCOUNT_CLOSED', message: 'Account closed.' }
  }

  private passwordMatches(user: User, plain: string) {
    return hash.verify(user.password, plain)
  }

  /**
   * Deliberately the same 400 the login endpoint gives for a bad password.
   * A distinct code here would let a borrowed session confirm a guessed
   * password one attempt at a time.
   */
  private wrongPassword(response: HttpContext['response']) {
    return response.badRequest({
      errors: [{ code: 'INVALID_CURRENT_PASSWORD', message: 'That password is not correct.' }],
    })
  }

  /** `seller` has to be preloaded before transforming; Lucid won't fetch it. */
  private async withSeller(user: User) {
    await user.load((preloader) => preloader.load('seller'))
    return user
  }
}
