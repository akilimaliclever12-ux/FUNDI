import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/features/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    // Login lives outside this guarded layout to avoid a redirect loop.
    redirect("/admin-login");
  }

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Administration</h1>
          <p className="text-sm text-gray-500">{admin.full_name} · {admin.admin_role}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-gray-50">Tableau</Link>
          <Link href="/admin/workers" className="rounded-lg px-3 py-2 hover:bg-gray-50">Fundis</Link>
          <Link href="/admin/reviews" className="rounded-lg px-3 py-2 hover:bg-gray-50">Avis</Link>
          <Link href="/admin/leads" className="rounded-lg px-3 py-2 hover:bg-gray-50">Leads</Link>
          <LogoutButton className="ml-1 px-3 py-2" redirectTo="/admin-login" />
        </nav>
      </div>
      {children}
    </div>
  );
}
