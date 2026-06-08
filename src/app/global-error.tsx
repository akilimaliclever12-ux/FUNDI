"use client";

import { useEffect } from "react";

// Catches errors thrown in the root layout (e.g. the header). Must render its
// own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.update()),
      ).catch(() => {});
    }
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0A2240" }}>Une erreur est survenue</h1>
          <p style={{ color: "#6B7280", maxWidth: 360 }}>
            Réessayez ou rechargez la page.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => reset()} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
              Réessayer
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 16px", borderRadius: 12, border: 0, background: "#0A2C5E", color: "#fff", fontWeight: 600 }}>
              Recharger
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
