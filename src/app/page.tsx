import Link from "next/link";
import { getProfessions } from "@/lib/queries/reference";
import { SITE_TAGLINE } from "@/lib/constants";

export const revalidate = 3600; // ISR: refresh hourly

export default async function HomePage() {
  const professions = await getProfessions();

  return (
    <div>
      {/* Hero — signature black→blue gradient */}
      <section className="bg-brand-gradient text-white">
        <div className="container-page py-14 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            {SITE_TAGLINE}
          </h1>
          <p className="mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
            Électriciens, plombiers, menuisiers, maçons, soudeurs, peintres — vérifiés et
            joignables directement sur Fundi, près de chez vous à Bukavu.
          </p>

          <form action="/workers" className="mt-8 flex max-w-md gap-2">
            <input
              type="search"
              name="q"
              placeholder="De quoi avez-vous besoin ?"
              className="input flex-1 text-ink"
              aria-label="Recherche"
            />
            <button type="submit" className="btn bg-white px-5 font-semibold text-brand">
              Chercher
            </button>
          </form>

          <div className="mt-4 flex gap-3 text-sm">
            <Link href="/workers" className="font-medium text-white underline-offset-4 hover:underline">
              Parcourir tous les fundis →
            </Link>
          </div>
        </div>
      </section>

      {/* Professions grid */}
      <section className="container-page py-12">
        <h2 className="text-xl font-bold text-ink">Parcourir par métier</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {professions.map((p) => (
            <Link
              key={p.slug}
              href={`/workers?profession=${p.slug}`}
              className="card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-dark">
                ●
              </span>
              <span className="font-medium text-ink">{p.name_fr}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / how it works */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="container-page grid gap-6 py-12 sm:grid-cols-3">
          {[
            { t: "1. Cherchez", d: "Filtrez par métier et quartier pour trouver le bon fundi." },
            { t: "2. Vérifiez", d: "Profils vérifiés, photos de travaux et avis clients réels." },
            { t: "3. Contactez", d: "Discutez directement avec le fundi, ici sur Fundi." },
          ].map((s) => (
            <div key={s.t} className="card p-5">
              <h3 className="font-semibold text-ink">{s.t}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Worker CTA */}
      <section className="container-page py-12">
        <div className="card flex flex-col items-start gap-4 bg-brand-gradient-vivid p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Vous êtes un fundi ?</h2>
            <p className="text-blue-50">Créez votre profil gratuitement et trouvez plus de clients.</p>
          </div>
          <Link href="/rejoindre" className="btn bg-white font-semibold text-brand">
            Devenir fundi
          </Link>
        </div>
      </section>
    </div>
  );
}
