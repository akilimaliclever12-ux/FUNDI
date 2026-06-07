import Link from "next/link";
import type { Metadata } from "next";
import { searchWorkers } from "@/lib/queries/workers";
import { getProfessions, getLocations } from "@/lib/queries/reference";
import { WorkerCard } from "@/components/features/worker-card";
import { SearchFilters } from "@/components/features/search-filters";
import { PROFESSION_LABELS } from "@/lib/constants";
import type { SearchParams } from "@/types";

export const revalidate = 600; // ISR: 10 min

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const prof = searchParams.profession ? PROFESSION_LABELS[searchParams.profession] : null;
  const title = prof ? `${prof}s à Bukavu` : "Trouver un fundi à Bukavu";
  return { title, description: `Liste de ${prof ?? "travailleurs"} vérifiés à Bukavu.` };
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ workers, total, page, pageCount }, professions, locations] = await Promise.all([
    searchWorkers(searchParams),
    getProfessions(),
    getLocations(),
  ]);

  function pageHref(p: number) {
    const sp = new URLSearchParams(searchParams as Record<string, string>);
    sp.set("page", String(p));
    return `/workers?${sp.toString()}`;
  }

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-ink">Trouver un fundi</h1>
      <p className="mt-1 text-sm text-gray-500">{total} travailleur(s) vérifié(s)</p>

      <div className="mt-4">
        <SearchFilters
          professions={professions.map((p) => ({ slug: p.slug, name_fr: p.name_fr }))}
          locations={locations.map((l) => ({ slug: l.slug, name: l.name, type: l.type }))}
        />
      </div>

      {workers.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-gray-600">Aucun fundi trouvé pour ces critères.</p>
          <Link href="/workers" className="btn-ghost mt-4">Réinitialiser</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn-ghost">← Précédent</Link>
          )}
          <span className="px-2 text-gray-500">
            Page {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={pageHref(page + 1)} className="btn-ghost">Suivant →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
