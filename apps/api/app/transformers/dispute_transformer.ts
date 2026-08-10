import type Dispute from '#models/dispute'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DisputeTransformer extends BaseTransformer<Dispute> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'reason',
      'detail',
      'status',
      'resolutionNote',
      'createdAt',
      'resolvedAt',
    ])
  }
}
