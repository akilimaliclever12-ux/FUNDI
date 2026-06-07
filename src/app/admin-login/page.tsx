import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/features/admin-login-form";

export const metadata: Metadata = {
  title: "Connexion admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="container-page flex max-w-sm flex-col justify-center py-16">
      <h1 className="text-xl font-bold text-ink">Connexion administration</h1>
      <p className="mt-1 text-sm text-gray-500">Réservé à l&apos;équipe Fundi.</p>
      <div className="mt-6">
        <AdminLoginForm />
      </div>
    </div>
  );
}
