import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { HeaderAuth } from "./header-auth";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fundi" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-ink">{SITE_NAME}</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-gray-600">
          <Link href="/workers" className="rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-ink">
            Trouver
          </Link>
          <Link href="/about" className="hidden rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-ink sm:block">
            À propos
          </Link>
          <Link href="/contact" className="hidden rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-ink sm:block">
            Contact
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
