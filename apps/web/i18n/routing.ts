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
    "/shop/[shopSlug]/[productSlug]": {
      en: "/shop/[shopSlug]/[productSlug]",
      fi: "/kauppa/[shopSlug]/[productSlug]",
    },
    "/seller": {
      en: "/seller",
      fi: "/myyja",
    },
    "/seller/settings": {
      en: "/seller/settings",
      fi: "/myyja/asetukset",
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
