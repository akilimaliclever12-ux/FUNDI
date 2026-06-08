import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfessions, getCommunes } from "@/lib/queries/reference";
import { createClient } from "@/lib/supabase/server";
import { hasWorkerProfile } from "@/lib/queries/account";
import { OnboardingWizard } from "@/components/features/onboarding-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devenir fundi",
  description: "Créez votre profil de travailleur qualifié et trouvez plus de clients à Bukavu.",
};

export default async function JoinPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already a fundi? Don't offer to create a second profile — send to account.
  if (user && (await hasWorkerProfile())) {
    redirect("/compte");
  }

  const [professions, communes] = await Promise.all([getProfessions(), getCommunes()]);

  return (
    <div className="container-page max-w-xl py-8">
      <h1 className="text-2xl font-bold text-ink">Devenir fundi</h1>
      <p className="mt-1 text-gray-600">
        Créez votre compte gratuitement, remplissez vos infos, ajoutez des photos — et recevez des
        clients directement sur Fundi.
      </p>

      <div className="mt-6">
        <OnboardingWizard
          professions={professions.map((p) => ({ id: p.id, name_fr: p.name_fr }))}
          communes={communes}
          // a logged-in user without a worker profile skips the auth step
          alreadyAuthed={!!user}
        />
      </div>
    </div>
  );
}
