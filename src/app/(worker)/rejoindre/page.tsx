import type { Metadata } from "next";
import { getProfessions, getLocations } from "@/lib/queries/reference";
import { OnboardingWizard } from "@/components/features/onboarding-wizard";

export const metadata: Metadata = {
  title: "Devenir fundi",
  description: "Créez votre profil de travailleur qualifié et trouvez plus de clients à Bukavu.",
};

export default async function JoinPage() {
  const [professions, locations] = await Promise.all([getProfessions(), getLocations()]);

  return (
    <div className="container-page max-w-xl py-8">
      <h1 className="text-2xl font-bold text-ink">Devenir fundi</h1>
      <p className="mt-1 text-gray-600">
        Créez votre profil gratuitement. Vérifiez votre numéro, remplissez vos infos, ajoutez des
        photos — et recevez des clients directement sur Fundi.
      </p>

      <div className="mt-6">
        <OnboardingWizard
          professions={professions.map((p) => ({ id: p.id, name_fr: p.name_fr }))}
          locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
        />
      </div>
    </div>
  );
}
