"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A common cause of client exceptions is a stale cached bundle after a
    // deploy. Nudge the service worker to fetch its latest version.
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.update()),
      ).catch(() => {});
    }
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-bold text-ink">Une erreur est survenue</h1>
      <p className="mt-1 max-w-sm text-gray-500">
        Quelque chose s&apos;est mal passé. Réessayez ou rechargez la page.
      </p>
      <div className="mt-5 flex gap-2">
        <button onClick={() => reset()} className="btn-ghost">Réessayer</button>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Recharger la page
        </button>
      </div>
    </div>
  );
}
