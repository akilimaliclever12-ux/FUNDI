import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">Page introuvable</h1>
      <p className="mt-1 text-gray-500">Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}
