import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, channel, source_page, created_at, worker:workers(headline)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-ink">Leads récents</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-left text-gray-500">
            <tr>
              <th className="p-3">Fundi</th>
              <th className="p-3">Canal</th>
              <th className="p-3">Source</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">Aucun lead.</td>
              </tr>
            )}
            {(leads ?? []).map((l: any) => (
              <tr key={l.id}>
                <td className="p-3 font-medium text-ink">{l.worker?.headline ?? "—"}</td>
                <td className="p-3"><Badge variant="success">{l.channel}</Badge></td>
                <td className="p-3 text-gray-500">{l.source_page ?? "—"}</td>
                <td className="p-3 text-gray-500">
                  {new Date(l.created_at).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
