"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Header "Messages" link with a live unread badge. */
export function MessagesLink({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("conversations")
        .select("customer_user_id, customer_unread, worker_unread");
      if (!active) return;
      const total = (data ?? []).reduce(
        (sum: number, c: { customer_user_id: string; customer_unread: number; worker_unread: number }) =>
          sum + (c.customer_user_id === user.id ? c.customer_unread : c.worker_unread),
        0,
      );
      setUnread(total);
    }

    load();

    // live: any new message in the user's conversations (RLS-filtered) refreshes the count
    const channel = supabase
      .channel("unread-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
    // re-run on navigation so opening/leaving a conversation updates the badge
  }, [pathname]);

  return (
    <Link href="/messages" className={className}>
      <span className="relative inline-flex items-center">
        Messages
        {unread > 0 && (
          <span className="ml-1 inline-grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </span>
    </Link>
  );
}
