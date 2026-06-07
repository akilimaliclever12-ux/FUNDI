import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import type { WorkerStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

const STATUS_TABS: { key: WorkerStatus | "all"; label: string }[] = [
  { key: "pending", label: "À valider" },
  { key: "approved", label: "Approuvés" },
  { key: "rejected", label: "Rejetés" },
  { key: "suspended", label: "Suspendus" },
  { key: "all", label: "Tous" },
];

const statusVariant: Record<WorkerStatus, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "neutral",
};

export default async function AdminWorkersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as WorkerStatus | "all") || "pending";
  const supabase = createClient();

  let query = supabase
    .from("workers")
    .select("id, headline, status, created_at, profession:professions(name_fr), location:locations(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);
  const { data: workers } = await query;

  return (
    <div>
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/workers?status=${t.key}`}
            className={`rounded-full px-3 py-1.5 ${
              status === t.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="card divide-y divide-gray-100">
        {(workers ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">Aucun fundi.</p>
        )}
        {(workers ?? []).map((w: any) => (
          <Link
            key={w.id}
            href={`/admin/workers/${w.id}`}
            className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{w.headline}</p>
              <p className="text-sm text-gray-500">
                {w.profession?.name_fr ?? "—"} · {w.location?.name ?? "—"}
              </p>
            </div>
            <Badge variant={statusVariant[w.status as WorkerStatus]}>{w.status}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
