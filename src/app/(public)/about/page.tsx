import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "À propos",
  description: `${SITE_NAME} connecte les habitants de Bukavu avec des travailleurs qualifiés et vérifiés.`,
};

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <div className="bg-brand-gradient -mx-4 mb-8 px-4 py-12 text-white sm:rounded-2xl">
        <h1 className="text-3xl font-bold">À propos de {SITE_NAME}</h1>
        <p className="mt-2 max-w-2xl text-blue-100">
          Rendre facile et sûr de trouver un travailleur qualifié de confiance à Bukavu — et aider
          les fundis à gagner plus de clients.
        </p>
      </div>

      <div className="prose-sm max-w-2xl space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-ink">Notre mission</h2>
          <p>
            À Bukavu, trouver un bon électricien, plombier ou maçon dépend souvent du bouche-à-oreille.
            {` ${SITE_NAME} `} rassemble les meilleurs artisans en un seul endroit de confiance, avec
            des profils vérifiés, des photos de travaux et de vrais avis clients.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Comment ça marche</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Cherchez par métier et par quartier.</li>
            <li>Comparez les profils, les photos et les avis.</li>
            <li>Contactez le fundi directement sur WhatsApp.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink">Nos valeurs</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Confiance d&apos;abord</strong> — chaque fundi est vérifié avant publication.</li>
            <li><strong>Dignité du travail</strong> — un fundi est un professionnel.</li>
            <li><strong>Simplicité</strong> — rapide, même avec une connexion lente.</li>
          </ul>
        </section>

        <div className="flex gap-3 pt-2">
          <Link href="/workers" className="btn-primary">Trouver un fundi</Link>
          <Link href="/rejoindre" className="btn-ghost">Devenir fundi</Link>
        </div>
      </div>
    </div>
  );
}
