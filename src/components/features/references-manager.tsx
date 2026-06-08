"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addReference, deleteReference } from "@/app/compte/actions";
import type { ReferenceRow } from "@/types/database.types";

export function ReferencesManager({ references }: { references: ReferenceRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await addReference({ name, position, contact });
    setBusy(false);
    if (!res.ok) return setMsg(res.error ?? "Erreur");
    setName("");
    setPosition("");
    setContact("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette référence ?")) return;
    await deleteReference(id);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-ink">Personnes de référence</h3>
      <p className="mt-1 text-sm text-gray-500">
        Des personnes qui peuvent témoigner de votre travail. Leur <strong>contact reste privé</strong> :
        visible uniquement par vous et l&apos;administration. Le public voit seulement le nom et le poste.
      </p>

      {references.length > 0 && (
        <ul className="mt-3 space-y-2">
          {references.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                <p className="text-xs text-gray-500">
                  {r.position ? `${r.position} · ` : ""}
                  <span className="text-gray-400">🔒 {r.contact}</span>
                </p>
              </div>
              <button onClick={() => remove(r.id)} className="text-sm text-danger hover:underline">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="Poste (optionnel)" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <input className="input" placeholder="Contact (téléphone / email) — privé" value={contact} onChange={(e) => setContact(e.target.value)} required />
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Ajout…" : "Ajouter la référence"}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  );
}
