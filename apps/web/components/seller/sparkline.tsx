/**
 * A trend line, not a chart. No axes, no labels, no tooltip — it exists to
 * say "roughly this shape lately" beside a number that says the rest.
 *
 * Flat series are drawn along the middle rather than the floor: a shop with
 * no orders all fortnight should read as level, not as having crashed.
 */
export function Sparkline({
  series,
  className = "",
  height = 34,
  width = 2,
}: {
  series: number[];
  className?: string;
  /** Shorter on a phone, where it sits inline beside the number. */
  height?: number;
  /** Thicker when smaller, or the line disappears. */
  width?: number;
}) {
  if (series.length < 2) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min;

  const points = series
    .map((value, i) => {
      const x = (i / (series.length - 1)) * 96;
      const y = span === 0 ? 17 : 30 - ((value - min) / span) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      height={height}
      viewBox="0 0 96 34"
      preserveAspectRatio="none"
      className={`w-24 max-w-[40%] min-w-0 ${className}`}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
