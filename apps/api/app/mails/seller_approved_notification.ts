import { BaseMail } from '@adonisjs/mail'
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
          `<p>Your shop "${this.seller.shopName}" is now live on Ecommerce.</p>`
      )
  }
}
