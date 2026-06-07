"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/features/logout-button";

/**
 * Client-side auth island. Keeps the Header a static server component (no
 * cookies() at render) so public pages stay cacheable. Defaults to the
 * "Devenir fundi" CTA, then swaps to a logout button if a session exists.
 */
export function HeaderAuth() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (signedIn) {
    return <LogoutButton className="ml-1 px-3 py-2 text-xs sm:text-sm" />;
  }

  // default (anonymous, or while resolving): show the primary CTA
  return (
    <Link href="/rejoindre" className="btn-gradient ml-1 px-3 py-2 text-xs sm:text-sm">
      Devenir fundi
    </Link>
  );
}
