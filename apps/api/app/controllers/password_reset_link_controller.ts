import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import PasswordResetToken from '#models/password_reset_token'
import { resetPasswordUrl } from '#services/frontend_routes'
import { forgotPasswordValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class PasswordResetLinkController {
  async store({ request }: HttpContext) {
    const { email, locale } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)

    if (user) {
      const token = await PasswordResetToken.generateFor(email)
      const resetUrl = resetPasswordUrl(locale ?? 'en', token, email)

      await mail.send((message) => {
        message
          .to(email)
          .subject('Reset your password')
          .html(
            `<p>Click the link below to reset your password. This link expires in 60 minutes.</p>` +
              `<p><a href="${resetUrl}">${resetUrl}</a></p>`
          )
      })
    }

    return {
      code: 'PASSWORD_RESET_LINK_SENT',
      message: 'If an account exists for this email, a password reset link has been sent.',
    }
  }
}
