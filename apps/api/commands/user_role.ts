import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { USER_ROLES, type UserRole } from '#models/user'

/**
 * Grants or revokes staff access.
 *
 * A command rather than a screen, deliberately. This is the most dangerous
 * operation in the application — `admin` can settle disputes and move other
 * people's money — and there is no version of it that should be one misclick
 * away in a web UI. Someone has to have shell access and type the address out.
 *
 * `node ace user:role someone@example.com staff`
 */
export default class SetUserRole extends BaseCommand {
  static commandName = 'user:role'
  static description = "Set a user's role (customer, staff or admin)"
  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Email address of the user' })
  declare email: string

  @args.string({ description: `One of: ${USER_ROLES.join(', ')}` })
  declare role: string

  async run() {
    const { default: User } = await import('#models/user')

    if (!(USER_ROLES as readonly string[]).includes(this.role)) {
      this.logger.error(`Unknown role "${this.role}". Expected one of: ${USER_ROLES.join(', ')}`)
      this.exitCode = 1
      return
    }

    const user = await User.findBy('email', this.email)
    if (!user) {
      this.logger.error(`No user with email ${this.email}`)
      this.exitCode = 1
      return
    }

    const previous = user.role
    user.role = this.role as UserRole
    await user.save()

    this.logger.info(`${user.email}: ${previous} → ${user.role}`)
  }
}
