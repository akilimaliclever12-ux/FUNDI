// NOTE: keep this module free of Node-only imports (e.g. `crypto`) — it is
// imported by Client Components. Server-only helpers live in server-utils.ts.

/** Tailwind className combiner (no extra deps). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a CDF amount for display. */
export function formatCdf(amount?: number | null): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("fr-FR")} FC`;
}

/** Price range display for a worker. */
export function formatRate(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatCdf(min)} – ${formatCdf(max)}`;
  return formatCdf(min ?? max);
}

/** Initials for an avatar fallback. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
