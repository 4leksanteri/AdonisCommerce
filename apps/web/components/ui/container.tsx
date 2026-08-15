import type { ReactNode } from "react";

/**
 * `wide` is the storefront shell. `panel` is the narrower column the account,
 * seller, staff and admin panels sit in — a nav plus a reading-width body
 * doesn't fill 1280px, and a centred container its contents can't fill reads
 * as bunched to the left rather than as centred.
 */
const WIDTHS = {
  wide: "max-w-7xl",
  panel: "max-w-[1160px]",
  /** Narrower again: checkout is a form and a receipt, and nothing else. */
  checkout: "max-w-[1000px]",
} as const;

export function Container({
  children,
  className = "",
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: keyof typeof WIDTHS;
}) {
  return <div className={`mx-auto w-full ${WIDTHS[width]} px-6 ${className}`}>{children}</div>;
}
