"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/** Routes that bring their own chrome instead of the storefront's. */
const OWN_CHROME = ["/seller"];

/**
 * Hides the storefront header and footer on panels that replace them.
 *
 * The seller panel is an application shell — a sidebar, a breadcrumb bar, no
 * site chrome — so rendering the shop's header above it would be two
 * navigations stacked. A route group would express this more cleanly, but
 * that means moving every file under a `(storefront)` directory; this is the
 * same outcome for one small component.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (OWN_CHROME.some((prefix) => pathname.startsWith(prefix))) return null;

  return <>{children}</>;
}
