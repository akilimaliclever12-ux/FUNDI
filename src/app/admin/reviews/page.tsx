import { createClient } from "@/lib/supabase/server";
import { Rating } from "@/components/ui/rating";
import { AdminReviewActions } from "@/components/features/admin-review-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, status, created_at, worker:workers(headline)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-ink">Avis à modérer</h2>
      <div className="card divide-y divide-gray-100">
        {(reviews ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">Aucun avis en attente.</p>
        )}
        {(reviews ?? []).map((r: any) => (
          <div key={r.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-ink">{r.author_name}</span>
                <span className="ml-2 text-sm text-gray-500">→ {r.worker?.headline}</span>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
            <AdminReviewActions reviewId={r.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
