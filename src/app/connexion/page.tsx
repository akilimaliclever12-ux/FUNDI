import type { Metadata } from "next";
import { AuthPanel } from "@/components/features/auth-panel";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous pour discuter avec un fundi.",
};

export default function ConnexionPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // only allow internal redirect targets
  const next =
    searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : "/messages";

  return (
    <div className="container-page max-w-sm py-12">
      <h1 className="text-xl font-bold text-ink">Connexion</h1>
      <p className="mt-1 text-sm text-gray-500">
        Connectez-vous par téléphone ou par email pour discuter avec les fundis.
      </p>
      <div className="mt-6">
        <AuthPanel next={next} />
      </div>
    </div>
  );
}
