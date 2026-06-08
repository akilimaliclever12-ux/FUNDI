import {
  Zap,
  Wrench,
  Hammer,
  BrickWall,
  Flame,
  PaintRoller,
  HardHat,
  Ruler,
  type LucideIcon,
} from "lucide-react";

// Map each profession (by slug) to a real trade icon.
const ICONS: Record<string, LucideIcon> = {
  electrician: Zap,
  plumber: Wrench,
  carpenter: Hammer,
  mason: BrickWall,
  welder: Flame,
  painter: PaintRoller,
  construction: HardHat,
};

export function ProfessionIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = ICONS[slug] ?? Ruler;
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}
