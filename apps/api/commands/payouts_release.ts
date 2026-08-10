import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Runs the payout sweep by hand.
 *
 * The worker does this on a schedule, but having it as a command means a
 * stuck payout can be cleared without waiting for a cron tick or restarting
 * anything — and it is the same code path, so it can't drift from what the
 * worker does.
 */
export default class PayoutsRelease extends BaseCommand {
  static commandName = 'payouts:release'
  static description = 'Complete and pay out every order whose hold has run out'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { releaseDuePayouts } = await import('#services/payments')
    const released = await releaseDuePayouts()
    this.logger.info(`Released ${released} order(s)`)
  }
}
