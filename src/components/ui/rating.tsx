import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <span aria-hidden className="text-amber-500">
        {"★".repeat(full)}
        <span className="text-gray-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-medium text-ink">{value.toFixed(1)}</span>
      {count != null && <span className="text-gray-400">({count})</span>}
    </span>
  );
}
