import Link from "next/link";
import type { WorkerWithRelations } from "@/types";
import { WorkerImage } from "./worker-avatar";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { formatRate } from "@/lib/utils";

export function WorkerCard({ worker }: { worker: WorkerWithRelations }) {
  const primary =
    worker.photos?.find((p) => p.is_primary && p.type !== "verification") ??
    worker.photos?.find((p) => p.type === "portfolio" || p.type === "avatar");
  const rate = formatRate(worker.hourly_rate_min, worker.hourly_rate_max);

  return (
    <Link href={`/workers/${worker.id}`} className="card group block overflow-hidden">
      <div className="relative h-40 w-full overflow-hidden">
        <WorkerImage
          publicId={primary?.cloudinary_public_id}
          name={worker.headline}
          width={480}
          height={320}
          className="h-40 w-full transition group-hover:scale-105"
        />
        {worker.is_featured && (
          <span className="absolute left-2 top-2">
            <Badge variant="brand">⭐ En vedette</Badge>
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand">{worker.profession?.name_fr ?? "Fundi"}</Badge>
          {worker.rating_count > 0 && (
            <Rating value={worker.rating_avg} count={worker.rating_count} />
          )}
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink">{worker.headline}</h3>
        <p className="text-sm text-gray-500">
          📍 {worker.location?.name ?? "Bukavu"}
          {worker.years_experience != null && ` · ${worker.years_experience} ans d'exp.`}
        </p>
        {rate && <p className="text-sm font-medium text-brand">{rate}</p>}
      </div>
    </Link>
  );
}
