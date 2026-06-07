import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWorkerById } from "@/lib/queries/workers";
import { WorkerImage } from "@/components/features/worker-avatar";
import { WhatsAppButton } from "@/components/features/whatsapp-button";
import { ReviewForm } from "@/components/features/review-form";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { formatRate } from "@/lib/utils";
import { defaultContactMessage } from "@/lib/whatsapp";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const worker = await getWorkerById(params.id);
  if (!worker) return { title: "Fundi introuvable" };
  return {
    title: `${worker.headline} — ${worker.profession?.name_fr ?? "Fundi"} à ${worker.location?.name ?? "Bukavu"}`,
    description: worker.bio?.slice(0, 150) ?? worker.headline,
  };
}

export default async function WorkerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const worker = await getWorkerById(params.id);
  if (!worker) notFound();

  const photos = (worker.photos ?? []).filter((p) => p.type !== "verification");
  const cover = photos.find((p) => p.is_primary) ?? photos[0];
  const gallery = photos.filter((p) => p.id !== cover?.id);
  const reviews = (worker.reviews ?? []).filter((r) => r.status === "published");
  const rate = formatRate(worker.hourly_rate_min, worker.hourly_rate_max);
  const waMsg = defaultContactMessage(worker.headline, worker.profession?.name_fr);

  return (
    <div className="container-page py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <WorkerImage
              url={cover?.url}
              name={worker.headline}
              width={900}
              height={500}
              className="h-56 w-full sm:h-72"
            />
            <div className="space-y-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{worker.profession?.name_fr ?? "Fundi"}</Badge>
                <Badge variant="success">✓ Vérifié</Badge>
                {worker.rating_count > 0 && (
                  <Rating value={worker.rating_avg} count={worker.rating_count} />
                )}
              </div>
              <h1 className="text-xl font-bold text-ink">{worker.headline}</h1>
              <p className="text-sm text-gray-600">
                📍 {worker.location?.name ?? "Bukavu"}
                {worker.years_experience != null &&
                  ` · ${worker.years_experience} ans d'expérience`}
              </p>
              {rate && <p className="font-medium text-brand">{rate}</p>}
              {worker.bio && (
                <p className="whitespace-pre-line pt-2 text-sm leading-relaxed text-gray-700">
                  {worker.bio}
                </p>
              )}
              {worker.service_areas && worker.service_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {worker.service_areas.map((a) => (
                    <Badge key={a}>{a}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-ink">Travaux récents</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt={p.caption ?? worker.headline}
                    width={400}
                    height={400}
                    loading="lazy"
                    className="h-32 w-full rounded-xl object-cover sm:h-40"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="mb-3 font-semibold text-ink">
              Avis {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{r.author_name}</span>
                      <Rating value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ReviewForm workerId={worker.id} />
            </div>
          </div>
        </div>

        {/* Sticky contact card */}
        <aside className="lg:col-span-1">
          <div className="card space-y-3 p-5 lg:sticky lg:top-20">
            <p className="text-sm text-gray-600">Intéressé par ce fundi ?</p>
            <WhatsAppButton
              workerId={worker.id}
              number={worker.whatsapp_number}
              message={waMsg}
            />
            <p className="text-center text-xs text-gray-400">
              Vous serez redirigé vers WhatsApp pour discuter directement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
