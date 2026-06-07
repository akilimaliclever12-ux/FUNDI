import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminWorkerActions } from "@/components/features/admin-worker-actions";
import { Badge } from "@/components/ui/badge";
import { cldUrl } from "@/lib/cloudinary";
import { formatRate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminWorkerDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: worker } = await supabase
    .from("workers")
    .select(
      `*, profession:professions(name_fr), location:locations(name), photos:worker_photos(*)`,
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!worker) notFound();
  const w: any = worker;

  return (
    <div>
      <Link href="/admin/workers" className="text-sm text-brand hover:underline">
        ← Retour à la liste
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{w.profession?.name_fr ?? "—"}</Badge>
              <Badge>{w.status}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-bold text-ink">{w.headline}</h2>
            <p className="text-sm text-gray-500">
              📍 {w.location?.name} · {w.years_experience ?? 0} ans · {formatRate(w.hourly_rate_min, w.hourly_rate_max) ?? "tarif n/c"}
            </p>
            <p className="mt-1 text-sm text-gray-500">WhatsApp : {w.whatsapp_number}</p>
            {w.bio && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{w.bio}</p>}
            {w.rejection_reason && (
              <p className="mt-2 text-sm text-danger">Rejet : {w.rejection_reason}</p>
            )}
          </div>

          {/* All photos incl. verification (admin only) */}
          {w.photos?.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-ink">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {w.photos.map((p: any) => (
                  <div key={p.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cldUrl(p.cloudinary_public_id, { width: 300, height: 300, crop: "fill" })}
                      alt={p.caption ?? "photo"}
                      className="h-28 w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                    {p.type === "verification" && (
                      <span className="absolute left-1 top-1">
                        <Badge variant="warning">ID</Badge>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <AdminWorkerActions
            workerId={w.id}
            status={w.status}
            headline={w.headline}
            bio={w.bio}
            yearsExperience={w.years_experience}
          />
        </div>
      </div>
    </div>
  );
}
