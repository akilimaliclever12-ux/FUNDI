import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function Footer() {
  const year = 2026;
  return (
    <footer className="mt-12 bg-brand-gradient-deep text-gray-300">
      <div className="container-page py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold">
                F
              </span>
              <span className="text-lg font-bold">{SITE_NAME}</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-gray-400">{SITE_TAGLINE}</p>
            <p className="mt-1 text-xs text-gray-500">Bukavu, RD Congo</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <Link href="/workers" className="hover:text-white">Trouver un fundi</Link>
            <Link href="/rejoindre" className="hover:text-white">Devenir fundi</Link>
            <Link href="/about" className="hover:text-white">À propos</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-gray-500">
          © {year} {SITE_NAME}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
