"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  redirectTo = "/",
  children = "Déconnexion",
}: {
  className?: string;
  redirectTo?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={cn("btn-ghost", className)}
    >
      {isPending ? "…" : children}
    </button>
  );
}
