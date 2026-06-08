import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccount } from "@/lib/queries/account";
import { getProfessions, getCommunes } from "@/lib/queries/reference";
import { AccountView } from "@/components/features/account-view";
import { NotificationOptIn } from "@/components/features/notification-opt-in";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const account = await getAccount();
  if (!account) redirect("/connexion?next=/compte");

  const [professions, communes] = await Promise.all([getProfessions(), getCommunes()]);

  return (
    <div className="container-page max-w-2xl py-6">
      <h1 className="text-2xl font-bold text-ink">Mon compte</h1>
      <div className="mt-4 space-y-6">
        <AccountView
          account={account}
          professions={professions.map((p) => ({ id: p.id, name_fr: p.name_fr }))}
          communes={communes}
        />
        <NotificationOptIn />
      </div>
    </div>
  );
}
