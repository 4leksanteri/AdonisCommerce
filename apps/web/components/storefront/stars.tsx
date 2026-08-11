/**
 * A rating as five stars, filled by width rather than rounded to whole ones.
 *
 * The overlay approach keeps 4.3 looking like 4.3 instead of snapping to 4,
 * and it stays a single accessible label rather than five separate glyphs a
 * screen reader would read out one at a time.
 */
export function Stars({
  value,
  label,
  size = "sm",
}: {
  value: number;
  /** Read out instead of the stars themselves, e.g. "4.3 out of 5". */
  label: string;
  size?: "sm" | "lg";
}) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const text = size === "lg" ? "text-xl" : "text-sm";

  return (
    <span className={`relative inline-block leading-none ${text}`} role="img" aria-label={label}>
      <span className="text-border" aria-hidden>
        ★★★★★
      </span>
      <span
        className="absolute inset-0 overflow-hidden text-warning"
        style={{ width: `${percent}%` }}
        aria-hidden
      >
        ★★★★★
      </span>
    </span>
  );
}
