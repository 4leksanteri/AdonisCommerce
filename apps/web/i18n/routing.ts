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
    "/seller": {
      en: "/seller",
      fi: "/myyja",
    },
    "/seller/settings": {
      en: "/seller/settings",
      fi: "/myyja/asetukset",
    },
  },
});
