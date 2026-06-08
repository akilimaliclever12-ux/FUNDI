import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { NavMenu } from "./nav-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-2">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fundi" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-ink">{SITE_NAME}</span>
        </Link>

        <NavMenu />
      </div>
    </header>
  );
}
