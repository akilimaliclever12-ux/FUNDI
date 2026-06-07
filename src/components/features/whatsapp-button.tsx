"use client";

import { useState } from "react";
import { buildWaLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Logs a lead (fire-and-forget) then opens WhatsApp.
 * Lead logging must never block the redirect.
 */
export function WhatsAppButton({
  workerId,
  number,
  message,
  sourcePage = "worker_profile",
  className,
  children = "Contacter sur WhatsApp",
}: {
  workerId: string;
  number: string;
  message?: string;
  sourcePage?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setBusy(true);
    const payload = JSON.stringify({
      worker_id: workerId,
      channel: "whatsapp",
      source_page: sourcePage,
    });

    try {
      // sendBeacon survives navigation; fall back to fetch keepalive.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/leads", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // ignore — never block contact
    }

    window.location.href = buildWaLink(number, message);
  }

  return (
    <a
      href={buildWaLink(number, message)}
      onClick={handleClick}
      className={cn("btn-whatsapp w-full", className)}
      aria-busy={busy}
      rel="nofollow"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607z" />
      </svg>
      {children}
    </a>
  );
}
