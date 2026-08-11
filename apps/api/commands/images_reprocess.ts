import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { rename, stat } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import sharp from 'sharp'
import { MAX_IMAGE_DIMENSION } from '#validators/product'

/**
 * Shrinks product photos that were stored before uploads were capped.
 *
 * Needed because the cap is not retroactive: anything uploaded when the
 * pipeline only re-encoded — and did not resize — is still sitting at
 * whatever dimensions came off the seller's phone, and will be until
 * something rewrites it.
 *
 * Rewrites the file in place under the same name, so nothing in the database
 * has to change and no page can end up pointing at a file that moved.
 */
export default class ImagesReprocess extends BaseCommand {
  static commandName = 'images:reprocess'
  static description = 'Resize stored product photos that exceed the current cap'
  static options: CommandOptions = { startApp: true }

  @flags.boolean({ description: 'Report what would change without writing' })
  declare dryRun: boolean

  async run() {
    const { default: ProductImage } = await import('#models/product_image')

    const images = await ProductImage.all()
    let resized = 0
    let savedBytes = 0

    for (const image of images) {
      const path = app.makePath('storage/uploads', image.path)

      let before: { width?: number; height?: number }
      try {
        before = await sharp(path).metadata()
      } catch {
        // A row whose file has gone is a separate problem; skip rather than
        // abort a run that is fixing everything else.
        this.logger.warning(`missing file for ${image.id}: ${image.path}`)
        continue
      }

      const longest = Math.max(before.width ?? 0, before.height ?? 0)
      if (longest <= MAX_IMAGE_DIMENSION) continue

      const statsBefore = await stat(path)
      const sizeBefore = statsBefore.size

      if (this.dryRun) {
        this.logger.info(`would resize ${image.path} (${before.width}x${before.height})`)
        resized++
        continue
      }

      /**
       * Written alongside and then moved into place. sharp cannot read and
       * write the same file in one pass, and a rename is atomic — a crash
       * mid-run leaves the original intact rather than a truncated image.
       */
      const temporary = `${path}.resized`
      await sharp(path)
        .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(temporary)

      const statsAfter = await stat(temporary)
      const sizeAfter = statsAfter.size
      await rename(temporary, path)

      savedBytes += sizeBefore - sizeAfter
      resized++
      this.logger.info(`${image.path}: ${before.width}x${before.height} → capped`)
    }

    const megabytes = (savedBytes / 1024 / 1024).toFixed(1)
    this.logger.info(
      this.dryRun
        ? `${resized} of ${images.length} image(s) would be resized`
        : `Resized ${resized} of ${images.length} image(s), saving ${megabytes} MB`
    )
  }
}
