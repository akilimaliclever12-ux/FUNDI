import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  const supabase = createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminOverview() {
  const [pending, approved, reviewsPending, leads] = await Promise.all([
    count("workers", (q) => q.eq("status", "pending").is("deleted_at", null)),
    count("workers", (q) => q.eq("status", "approved").is("deleted_at", null)),
    count("reviews", (q) => q.eq("status", "pending")),
    count("leads"),
  ]);

  const stats = [
    { label: "À valider", value: pending, href: "/admin/workers?status=pending", accent: true },
    { label: "Fundis approuvés", value: approved, href: "/admin/workers?status=approved" },
    { label: "Avis à modérer", value: reviewsPending, href: "/admin/reviews" },
    { label: "Leads (total)", value: leads, href: "/admin/leads" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className={`card p-5 transition hover:shadow ${s.accent ? "ring-2 ring-brand/30" : ""}`}
        >
          <p className="text-3xl font-bold text-ink">{s.value}</p>
          <p className="mt-1 text-sm text-gray-500">{s.label}</p>
        </Link>
      ))}
    </div>
  );
}
