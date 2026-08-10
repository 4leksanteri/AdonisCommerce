import vine from '@vinejs/vine'
import { DISPUTE_REASONS } from '#models/dispute'

export const openDisputeValidator = vine.create({
  reason: vine.enum(DISPUTE_REASONS),
  // Optional, because "it never arrived" needs no elaboration, and demanding
  // an essay before someone can report a missing parcel just loses the report.
  detail: vine.string().trim().maxLength(2000).optional(),
})
