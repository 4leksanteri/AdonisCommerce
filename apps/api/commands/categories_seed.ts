import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * The starting taxonomy.
 *
 * Deliberately flat and short. A deep tree over a small catalogue mostly
 * produces empty categories, which reads worse to a shopper than having
 * fewer — it can grow as listings arrive, and `categories.parent_id` means
 * that costs rows rather than a schema change.
 *
 * Idempotent: matched on the English slug, so re-running after adding an
 * entry adds only the new one. Names are never overwritten, since by then
 * someone may have corrected them from the admin panel.
 */
const TAXONOMY = [
  { en: ['Jewellery', 'jewellery'], fi: ['Korut', 'korut'] },
  {
    en: ['Clothing & accessories', 'clothing-accessories'],
    fi: ['Vaatteet ja asusteet', 'vaatteet-ja-asusteet'],
  },
  { en: ['Home & living', 'home-living'], fi: ['Koti ja sisustus', 'koti-ja-sisustus'] },
  {
    en: ['Kitchen & dining', 'kitchen-dining'],
    fi: ['Keittiö ja ruokailu', 'keittio-ja-ruokailu'],
  },
  { en: ['Art & prints', 'art-prints'], fi: ['Taide ja julisteet', 'taide-ja-julisteet'] },
  { en: ['Bath & beauty', 'bath-beauty'], fi: ['Kylpy ja kauneus', 'kylpy-ja-kauneus'] },
  { en: ['Kids & toys', 'kids-toys'], fi: ['Lapset ja lelut', 'lapset-ja-lelut'] },
  { en: ['Paper & party', 'paper-party'], fi: ['Paperi ja juhlat', 'paperi-ja-juhlat'] },
  { en: ['Craft supplies', 'craft-supplies'], fi: ['Askartelutarvikkeet', 'askartelutarvikkeet'] },
] as const

export default class CategoriesSeed extends BaseCommand {
  static commandName = 'categories:seed'
  static description = 'Create the starting category taxonomy if it is missing'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: Category } = await import('#models/category')
    const { default: CategoryTranslation } = await import('#models/category_translation')

    let created = 0

    for (const [position, entry] of TAXONOMY.entries()) {
      const existing = await CategoryTranslation.query()
        .where('locale', 'en')
        .where('slug', entry.en[1])
        .first()

      if (existing) continue

      const category = await Category.create({ position, isActive: true })

      for (const locale of ['en', 'fi'] as const) {
        const [name, slug] = entry[locale]
        await CategoryTranslation.create({ categoryId: category.id, locale, name, slug })
      }

      created++
      this.logger.info(`${entry.en[0]} / ${entry.fi[0]}`)
    }

    this.logger.info(`Created ${created} categor${created === 1 ? 'y' : 'ies'}`)
  }
}
