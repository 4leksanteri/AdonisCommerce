import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fi"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/reset-password": {
      en: "/reset-password",
      fi: "/salasanan-nollaus",
    },
    "/checkout": {
      en: "/checkout",
      fi: "/kassa",
    },
    /**
     * The buyer's own corner of the site. "Tili" is the account itself, as
     * against the panels, which are named for the job being done there.
     */
    "/account": {
      en: "/account",
      fi: "/tili",
    },
    "/account/orders": {
      en: "/account/orders",
      fi: "/tili/tilaukset",
    },
    "/account/orders/[reference]": {
      en: "/account/orders/[reference]",
      fi: "/tili/tilaukset/[reference]",
    },
    "/account/settings": {
      en: "/account/settings",
      fi: "/tili/asetukset",
    },
    /**
     * Where buyer orders used to live, kept as redirects. Order emails
     * already sent out point here, and those are in people's inboxes for
     * good — the paths can go once no live link can reach them.
     */
    "/orders": {
      en: "/orders",
      fi: "/tilaukset",
    },
    "/orders/[reference]": {
      en: "/orders/[reference]",
      fi: "/tilaukset/[reference]",
    },
    "/shop/[shopSlug]": {
      en: "/shop/[shopSlug]",
      fi: "/kauppa/[shopSlug]",
    },
    // Below the shop entry — matched in declaration order, same as products.
    "/shop/[shopSlug]/[productSlug]": {
      en: "/shop/[shopSlug]/[productSlug]",
      fi: "/kauppa/[shopSlug]/[productSlug]",
    },
    /**
     * "Hallinta" is control, as against "ylläpito" for upkeep — which is the
     * distinction between running the platform and running the day-to-day, so
     * the two panels don't read as synonyms.
     */
    "/admin": {
      en: "/admin",
      fi: "/hallinta",
    },
    "/admin/users": {
      en: "/admin/users",
      fi: "/hallinta/kayttajat",
    },
    "/admin/categories": {
      en: "/admin/categories",
      fi: "/hallinta/kategoriat",
    },
    // "Ylläpito" is what Finnish sites call the people who run the place,
    // which is exactly what staff are. Without diacritics, like every other
    // Finnish path here (`/myyja`, not `/myyjä`).
    "/staff": {
      en: "/staff",
      fi: "/yllapito",
    },
    "/staff/disputes": {
      en: "/staff/disputes",
      fi: "/yllapito/riitatapaukset",
    },
    "/staff/disputes/[id]": {
      en: "/staff/disputes/[id]",
      fi: "/yllapito/riitatapaukset/[id]",
    },
    "/seller": {
      en: "/seller",
      fi: "/myyja",
    },
    "/seller/orders": {
      en: "/seller/orders",
      fi: "/myyja/tilaukset",
    },
    // Below the static entry, same reason as the products routes: these match
    // in declaration order and `[id]` would otherwise swallow nothing useful.
    "/seller/orders/[id]": {
      en: "/seller/orders/[id]",
      fi: "/myyja/tilaukset/[id]",
    },
    "/seller/shipping": {
      en: "/seller/shipping",
      fi: "/myyja/toimitus",
    },
    "/seller/settings": {
      en: "/seller/settings",
      fi: "/myyja/asetukset",
    },
    // Stripe sends the seller back here after hosted onboarding, so this must
    // stay in step with SELLER_PAYOUTS_PATH in the API's frontend_routes.ts.
    "/seller/payouts": {
      en: "/seller/payouts",
      fi: "/myyja/tilitykset",
    },
    "/seller/products": {
      en: "/seller/products",
      fi: "/myyja/tuotteet",
    },
    "/seller/products/new": {
      en: "/seller/products/new",
      fi: "/myyja/tuotteet/uusi",
    },
    // Must stay below the static `/new` entry — these are matched in
    // declaration order, and `[id]` would otherwise swallow `uusi`/`new`.
    "/seller/products/[id]": {
      en: "/seller/products/[id]",
      fi: "/myyja/tuotteet/[id]",
    },
  },
});
