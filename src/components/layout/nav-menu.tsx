"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/features/logout-button";

const PUBLIC_LINKS = [
  { href: "/workers", label: "Trouver" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function NavMenu() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(!!user);
      if (!user) {
        setUnread(0);
        return;
      }
      const { data } = await supabase
        .from("conversations")
        .select("customer_user_id, customer_unread, worker_unread");
      if (!active) return;
      const total = (data ?? []).reduce(
        (
          sum: number,
          c: { customer_user_id: string; customer_unread: number; worker_unread: number },
        ) => sum + (c.customer_user_id === user.id ? c.customer_unread : c.worker_unread),
        0,
      );
      setUnread(total);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [pathname]);

  // close the mobile drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkCls = "rounded-lg px-3 py-2 hover:bg-gray-50 hover:text-ink";

  const UnreadBadge = () =>
    unread > 0 ? (
      <span className="ml-1 inline-grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  const authedLinks = (
    <>
      <Link href="/messages" className={linkCls}>
        <span className="inline-flex items-center">
          Messages
          <UnreadBadge />
        </span>
      </Link>
      <Link href="/compte" className={linkCls}>
        Compte
      </Link>
      <LogoutButton className="px-3 py-2 text-xs sm:text-sm" />
    </>
  );

  const guestLinks = (
    <>
      <Link href="/connexion" className={linkCls}>
        Connexion
      </Link>
      <Link href="/rejoindre" className="btn-accent px-3 py-2 text-xs sm:text-sm">
        Devenir fundi
      </Link>
    </>
  );

  // Render the auth-dependent section only once we know the state, to avoid
  // briefly showing the wrong buttons (e.g. "Devenir fundi" to a logged-in user).
  const authSection = signedIn === null ? null : signedIn ? authedLinks : guestLinks;

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 text-sm font-medium text-gray-600 sm:flex">
        {PUBLIC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={linkCls}>
            {l.label}
          </Link>
        ))}
        {authSection}
      </nav>

      {/* Mobile: hamburger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-gray-50 sm:hidden"
      >
        <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        {!open && unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
        )}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-gray-100 bg-white shadow-lg sm:hidden">
          <nav className="container-page flex flex-col py-2 text-base font-medium text-gray-700">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-2 py-3 hover:bg-gray-50">
                {l.label}
              </Link>
            ))}
            <div className="my-1 border-t border-gray-100" />
            {signedIn === true && (
              <>
                <Link href="/messages" className="flex items-center rounded-lg px-2 py-3 hover:bg-gray-50">
                  Messages <UnreadBadge />
                </Link>
                <Link href="/compte" className="rounded-lg px-2 py-3 hover:bg-gray-50">
                  Mon compte
                </Link>
                <div className="px-2 py-2">
                  <LogoutButton className="w-full">Déconnexion</LogoutButton>
                </div>
              </>
            )}
            {signedIn === false && (
              <>
                <Link href="/connexion" className="rounded-lg px-2 py-3 hover:bg-gray-50">
                  Connexion
                </Link>
                <div className="px-2 py-2">
                  <Link href="/rejoindre" className="btn-accent w-full">
                    Devenir fundi
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
