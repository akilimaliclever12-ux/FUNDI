import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: `Conditions Générales d'Utilisation de ${SITE_NAME}.`,
};

export default function ConditionsPage() {
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-ink">Conditions Générales d&apos;Utilisation</h1>
      <p className="mt-1 text-sm text-gray-500">Dernière mise à jour : 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-base font-bold text-ink">1. Objet</h2>
          <p>
            {SITE_NAME} est une plateforme qui met en relation des clients avec des travailleurs
            qualifiés (« fundis ») à Bukavu, RD Congo. {SITE_NAME} facilite la mise en relation mais
            n&apos;est pas partie aux contrats conclus entre clients et fundis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">2. Comptes</h2>
          <p>
            Vous pouvez créer un compte en tant que <strong>client</strong> ou <strong>fundi</strong>.
            Vous êtes responsable de l&apos;exactitude des informations fournies et de la
            confidentialité de votre accès. Un fundi s&apos;engage à fournir des informations
            véridiques (métier, expérience, certifications, références).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">3. Engagements des fundis</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Fournir des informations exactes et un portfolio représentant un travail réel.</li>
            <li>Ne pas publier de fausses certifications, attestations ou références.</li>
            <li>Traiter les clients avec professionnalisme et honnêteté.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">4. Engagements des clients</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Utiliser la messagerie de manière respectueuse.</li>
            <li>Convenir directement avec le fundi des modalités et tarifs des travaux.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">5. Données personnelles</h2>
          <p>
            Nous collectons les informations nécessaires au fonctionnement du service (nom, contact,
            profil). Les <strong>contacts des personnes de référence</strong> ne sont visibles que par
            le fundi concerné et l&apos;administration. Nous ne vendons pas vos données.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">6. Responsabilité</h2>
          <p>
            {SITE_NAME} ne garantit pas la qualité des prestations réalisées et ne saurait être tenu
            responsable des litiges entre clients et fundis. Les profils frauduleux ou abusifs
            peuvent être suspendus à tout moment.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">7. Modération</h2>
          <p>
            L&apos;administration peut vérifier, suspendre ou supprimer tout compte ou contenu
            contraire aux présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">8. Acceptation</h2>
          <p>
            En créant un compte sur {SITE_NAME}, vous reconnaissez avoir lu et accepté les présentes
            Conditions Générales d&apos;Utilisation.
          </p>
        </section>
      </div>
    </div>
  );
}
