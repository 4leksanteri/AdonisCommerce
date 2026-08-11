import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Dispute from '#models/dispute'
import StaffDisputeTransformer from '#transformers/staff_dispute_transformer'
import { resolveWithRefund, resolveWithRelease } from '#services/disputes'

const resolveValidator = vine.create({
  // Recorded on the dispute and shown to both sides, so it is worth asking
  // for even though nothing forces it.
  note: vine.string().trim().maxLength(2000).optional(),
})

const PER_PAGE = 25

/**
 * The queue of problems nobody else settled.
 *
 * Most disputes never reach here — the seller refunds, or the buyer withdraws
 * once the parcel turns up. This exists for the ones where the two disagree,
 * and for the case that would otherwise be a dead end: a seller who simply
 * ignores it while the payout sits held indefinitely.
 */
export default class StaffDisputesController {
  async index({ request, serialize }: HttpContext) {
    const status = request.input('status', 'open') as string
    const page = Number(request.input('page', 1)) || 1

    const disputes = await this.baseQuery()
      .if(status !== 'all', (query) => query.where('status', status))
      // Oldest first: the queue is work, and the one waiting longest is the
      // one someone has been waiting on longest.
      .orderBy('createdAt', 'asc')
      .paginate(page, PER_PAGE)

    return serialize(StaffDisputeTransformer.paginate(disputes.all(), disputes.getMeta()))
  }

  async show({ params, response, serialize }: HttpContext) {
    const dispute = await this.baseQuery().where('id', params.id).first()
    if (!dispute) return this.notFound(response)

    return serialize(StaffDisputeTransformer.transform(dispute))
  }

  /** Side with the buyer: refund in full and call the order off. */
  async refund({ params, request, auth, response, serialize }: HttpContext) {
    const dispute = await this.openDispute(params.id, response)
    // `openDispute` has already written the 404 or 409 onto the response.
    if (!dispute) return

    const { note } = await request.validateUsing(resolveValidator)
    await resolveWithRefund(dispute.order, dispute, auth.getUserOrFail().id, note ?? null)

    return serialize(StaffDisputeTransformer.transform(await this.reload(dispute.id)))
  }

  /** Side with the seller: close the case and let the payout go through. */
  async release({ params, request, auth, response, serialize }: HttpContext) {
    const dispute = await this.openDispute(params.id, response)
    if (!dispute) return

    const { note } = await request.validateUsing(resolveValidator)
    await resolveWithRelease(dispute.order, dispute, auth.getUserOrFail().id, note ?? null)

    return serialize(StaffDisputeTransformer.transform(await this.reload(dispute.id)))
  }

  private baseQuery() {
    return Dispute.query()
      .preload('openedBy')
      .preload('resolvedBy')
      .preload('order', (order) => order.preload('items').preload('seller'))
  }

  private async reload(id: string) {
    return this.baseQuery().where('id', id).firstOrFail()
  }

  /**
   * A dispute that someone already settled is not an error worth a stack
   * trace, but it must not be settled twice — that would refund a buyer who
   * has already been refunded.
   */
  private async openDispute(id: string, response: HttpContext['response']) {
    const dispute = await this.baseQuery().where('id', id).first()

    /**
     * Writes the failure response itself and hands back null. Returning the
     * response object instead does not work — Adonis's helpers set state on
     * the response rather than returning something the caller can test, so a
     * `if (error) return error` silently falls through and settles a dispute
     * that was already closed.
     */
    if (!dispute) {
      this.notFound(response)
      return null
    }

    if (!dispute.isOpen) {
      response.conflict({
        errors: [{ code: 'DISPUTE_NOT_OPEN', message: 'This dispute has already been settled.' }],
      })
      return null
    }

    return dispute
  }

  private notFound(response: HttpContext['response']) {
    return response.notFound({
      errors: [{ code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found.' }],
    })
  }
}
