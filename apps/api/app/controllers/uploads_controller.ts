import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

// Uploaded filenames are always generated server-side as `<uuid>.<ext>` (see
// ProductImagesController) — this pattern also rejects path traversal
// attempts (`../`, slashes, etc.) coming from the URL param.
const SAFE_FILENAME = /^[a-zA-Z0-9-]+\.[a-z0-9]+$/

export default class UploadsController {
  async show({ params, response }: HttpContext) {
    const filename = params.filename as string

    if (!SAFE_FILENAME.test(filename)) {
      return response.notFound()
    }

    return response.download(app.makePath('storage/uploads', filename))
  }
}
