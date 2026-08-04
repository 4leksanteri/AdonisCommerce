import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import { resetPasswordValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewPasswordController {
  async store({ request, response }: HttpContext) {
    const { email, token, password } = await request.validateUsing(resetPasswordValidator)

    const isValid = await PasswordResetToken.verify(email, token)
    if (!isValid) {
      return response.badRequest({
        errors: [
          {
            code: 'PASSWORD_RESET_TOKEN_INVALID',
            message: 'This password reset link is invalid or has expired.',
          },
        ],
      })
    }

    const user = await User.findByOrFail('email', email)
    user.password = password
    await user.save()

    await PasswordResetToken.consume(email)

    return {
      code: 'PASSWORD_RESET_SUCCESS',
      message: 'Password reset successfully.',
    }
  }
}
