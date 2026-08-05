import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import type Seller from '#models/seller'
import type User from '#models/user'

export default class SellerApprovedNotification extends BaseMail {
  subject = 'Your shop is live'

  constructor(
    private user: User,
    private seller: Seller
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .html(
        `<p>Hi ${this.user.fullName ?? 'there'},</p>` +
          `<p>Your shop "${this.seller.shopName}" is now live on ${env.get('APP_NAME')}.</p>`
      )
  }
}
