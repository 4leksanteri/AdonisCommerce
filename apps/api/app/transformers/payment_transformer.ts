import type Payment from '#models/payment'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class PaymentTransformer extends BaseTransformer<Payment> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'currency', 'status']),
      amountCents: Number(this.resource.amountCents),
      /**
       * Present only on the response that created the PaymentIntent. It is a
       * short-lived credential for confirming this one payment, which is
       * exactly what the browser needs and nothing more — it cannot read the
       * account or move money elsewhere.
       */
      clientSecret: this.resource.clientSecret ?? null,
    }
  }
}
