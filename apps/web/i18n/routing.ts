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
