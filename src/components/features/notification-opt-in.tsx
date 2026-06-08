"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "default" | "subscribed" | "denied";

export function NotificationOptIn() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC;
    if (!ok) {
      setState("unsupported");
      return;
    }
    (async () => {
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "default");
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!) as BufferSource,
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setState("subscribed");
    } catch {
      // ignore (e.g. user dismissed)
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setState("default");
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-ink">Notifications</h3>
      <p className="mt-1 text-sm text-gray-500">
        Recevez une alerte dès qu&apos;un nouveau message arrive, même quand l&apos;application est
        fermée.
      </p>
      <div className="mt-3">
        {state === "subscribed" && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-green-700">✓ Notifications activées</span>
            <button onClick={disable} disabled={busy} className="btn-ghost">
              {busy ? "…" : "Désactiver"}
            </button>
          </div>
        )}
        {state === "default" && (
          <button onClick={enable} disabled={busy} className="btn-accent">
            {busy ? "…" : "🔔 Activer les notifications"}
          </button>
        )}
        {state === "denied" && (
          <p className="text-sm text-gray-500">
            Les notifications sont bloquées dans votre navigateur. Activez-les dans les paramètres du
            site pour les recevoir.
          </p>
        )}
      </div>
    </div>
  );
}
