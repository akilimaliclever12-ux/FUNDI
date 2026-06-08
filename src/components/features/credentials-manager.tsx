"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { addCredential, deleteCredential } from "@/app/compte/actions";
import { CREDENTIAL_LABEL } from "@/lib/credentials";
import type { CredentialRow, CredentialType } from "@/types/database.types";

export function CredentialsManager({ credentials }: { credentials: CredentialRow[] }) {
  const router = useRouter();
  const [type, setType] = useState<CredentialType>("certification");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<UploadedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    if (title.trim().length < 2) return setMsg("Titre requis.");
    if (file.length < 1) return setMsg("Ajoutez le document (photo/scan).");
    setBusy(true);
    const res = await addCredential({
      type,
      title: title.trim(),
      storage_path: file[0].storage_path,
      url: file[0].url,
    });
    setBusy(false);
    if (!res.ok) return setMsg(res.error ?? "Erreur");
    setTitle("");
    setFile([]);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer ce document ?")) return;
    await deleteCredential(id);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-ink">Certifications, diplômes & attestations</h3>
      <p className="mt-1 text-sm text-gray-500">
        Ajoutez vos documents (certifications, diplômes, attestations de service rendu) pour
        rassurer les clients.
      </p>

      {credentials.length > 0 && (
        <ul className="mt-3 space-y-2">
          {credentials.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.url} alt={c.title} className="h-12 w-12 rounded object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                <p className="text-xs text-gray-400">{CREDENTIAL_LABEL[c.type]}</p>
              </div>
              <button onClick={() => remove(c.id)} className="text-sm text-danger hover:underline">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={type} onChange={(e) => setType(e.target.value as CredentialType)}>
            <option value="certification">Certification</option>
            <option value="diploma">Diplôme</option>
            <option value="attestation">Attestation de service rendu</option>
          </select>
          <input className="input" placeholder="Titre du document" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <PhotoUploader value={file} onChange={(p) => setFile(p.slice(0, 1))} />
        <button onClick={add} disabled={busy} className="btn-primary w-full">
          {busy ? "Ajout…" : "Ajouter le document"}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </div>
    </div>
  );
}
