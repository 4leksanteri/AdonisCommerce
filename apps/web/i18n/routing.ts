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
  },
});
