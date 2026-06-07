"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  setWorkerStatus,
  deleteWorker,
  editWorker,
} from "@/app/admin/actions";
import type { WorkerStatus } from "@/types/database.types";

export function AdminWorkerActions({
  workerId,
  status,
  headline,
  bio,
  yearsExperience,
}: {
  workerId: string;
  status: WorkerStatus;
  headline: string;
  bio: string | null;
  yearsExperience: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      setMsg(res.ok ? "✓ Fait" : res.error ?? "Erreur");
      if (res.ok) router.refresh();
    });
  }

  function approve() {
    run(() => setWorkerStatus(workerId, "approved"));
  }
  function reject() {
    const reason = window.prompt("Raison du rejet ?") ?? "";
    run(() => setWorkerStatus(workerId, "rejected", reason));
  }
  function suspend() {
    run(() => setWorkerStatus(workerId, "suspended"));
  }
  function remove() {
    if (window.confirm("Supprimer ce profil ? (soft-delete)")) {
      run(() => deleteWorker(workerId));
    }
  }
  function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() =>
      editWorker(workerId, {
        headline: String(fd.get("headline")),
        bio: String(fd.get("bio")),
        years_experience: Number(fd.get("years_experience")),
      }).then((r) => {
        if (r.ok) setEditing(false);
        return r;
      }),
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <h3 className="font-semibold text-ink">Actions</h3>

      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <button onClick={approve} disabled={isPending} className="btn bg-whatsapp text-white">
            ✓ Approuver
          </button>
        )}
        {status !== "rejected" && (
          <button onClick={reject} disabled={isPending} className="btn bg-danger text-white">
            ✕ Rejeter
          </button>
        )}
        {status === "approved" && (
          <button onClick={suspend} disabled={isPending} className="btn-ghost">
            Suspendre
          </button>
        )}
        <button onClick={() => setEditing((v) => !v)} disabled={isPending} className="btn-ghost">
          Éditer
        </button>
        <button onClick={remove} disabled={isPending} className="btn border border-danger text-danger">
          Supprimer
        </button>
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="space-y-2 border-t border-gray-100 pt-3">
          <div>
            <label className="label" htmlFor="e-headline">Titre</label>
            <input id="e-headline" name="headline" defaultValue={headline} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="e-exp">Expérience (ans)</label>
            <input id="e-exp" name="years_experience" type="number" defaultValue={yearsExperience ?? 0} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="e-bio">Bio</label>
            <textarea id="e-bio" name="bio" defaultValue={bio ?? ""} rows={3} className="input" />
          </div>
          <button className="btn-primary w-full" disabled={isPending}>Enregistrer</button>
        </form>
      )}

      {msg && <p className="text-sm text-gray-500">{msg}</p>}
    </div>
  );
}
