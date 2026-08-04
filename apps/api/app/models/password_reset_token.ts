import { PasswordResetTokenSchema } from '#database/schema'
import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'

const EXPIRY_MINUTES = 60

export default class PasswordResetToken extends PasswordResetTokenSchema {
  static hash(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Replaces any existing token for the email with a fresh one
   * and returns the raw (unhashed) token to send over email.
   */
  static async generateFor(email: string) {
    const token = randomBytes(32).toString('hex')

    await this.query().where('email', email).delete()
    await this.create({ email, token: this.hash(token) })

    return token
  }

  /**
   * Verifies a raw token against the stored hash and expiry window.
   * Expired tokens are deleted as a side effect.
   */
  static async verify(email: string, token: string) {
    const record = await this.query().where('email', email).where('token', this.hash(token)).first()

    if (!record) return false

    const ageInMinutes = DateTime.now().diff(record.createdAt, 'minutes').minutes
    if (ageInMinutes > EXPIRY_MINUTES) {
      await record.delete()
      return false
    }

    return true
  }

  static async consume(email: string) {
    await this.query().where('email', email).delete()
  }
}
