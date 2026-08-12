import Image from "next/image";

const SIZES = {
  sm: { box: "size-8", text: "text-xs", px: 32 },
  md: { box: "size-12", text: "text-sm", px: 48 },
  lg: { box: "size-20", text: "text-xl", px: 80 },
} as const;

/**
 * Up to two letters, so the fallback reads as a monogram rather than a word.
 * "Ale Studio" gives AS; a one-word shop gives its first two characters.
 */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Falls back to initials rather than a placeholder graphic. A shop that
 * hasn't uploaded a picture yet should look unfinished-but-intentional, not
 * broken — and the same monogram appears everywhere, so it still works as a
 * recognisable mark.
 */
export function ShopAvatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
}) {
  const { box, text, px } = SIZES[size];

  return (
    <span
      className={`${box} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-selected`}
    >
      {url ? (
        <Image src={url} alt="" width={px} height={px} className="h-full w-full object-cover" />
      ) : (
        <span className={`${text} font-medium text-muted`} aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
