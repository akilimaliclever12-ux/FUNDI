import { cn } from "@/lib/utils";

type Variant = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

const styles: Record<Variant, string> = {
  neutral: "bg-gray-100 text-gray-700",
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent-dark",
  success: "bg-whatsapp/10 text-green-700",
  warning: "bg-warning/10 text-amber-700",
  danger: "bg-danger/10 text-red-700",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
