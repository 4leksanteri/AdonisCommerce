import { StripeEventSchema } from '#database/schema'

export default class StripeEvent extends StripeEventSchema {
  /**
   * The primary key is Stripe's `evt_...` id, so it is supplied rather than
   * generated. Without this Lucid would expect the database to produce one.
   */
  static selfAssignPrimaryKey = true
}
