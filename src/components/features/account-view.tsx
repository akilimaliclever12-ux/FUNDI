"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { updateMyName, updateMyWorkerProfile } from "@/app/compte/actions";
import { normalizeDrcPhone } from "@/lib/phone";
import type { Account } from "@/lib/queries/account";
import type { ProfessionRow } from "@/types/database.types";
import type { CommuneNode } from "@/types";

const STATUS_LABEL: Record<string, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  pending: { label: "En attente de validation", variant: "warning" },
  approved: { label: "Approuvé · visible", variant: "success" },
  rejected: { label: "Rejeté", variant: "danger" },
  suspended: { label: "Suspendu", variant: "neutral" },
};

export function AccountView({
  account,
  professions,
  communes,
}: {
  account: Account;
  professions: Pick<ProfessionRow, "id" | "name_fr">[];
  communes: CommuneNode[];
}) {
  const router = useRouter();
  const worker = account.worker;

  // ----- name -----
  const [name, setName] = useState(account.fullName ?? "");
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    const res = await updateMyName(name);
    setSavingName(false);
    setNameMsg(res.ok ? "✓ Enregistré" : res.error ?? "Erreur");
    if (res.ok) router.refresh();
  }

  // ----- worker profile edit -----
  const initialCommune =
    communes.find((c) => c.id === worker?.location_id)?.id ??
    communes.find((c) => c.quartiers.some((q) => q.id === worker?.location_id))?.id ??
    "";
  const [communeId, setCommuneId] = useState(initialCommune);
  const quartierOptions = communes.find((c) => c.id === communeId)?.quartiers ?? [];

  const existing = (worker?.photos ?? []).filter((p) => p.type !== "verification");
  const [keptPhotos, setKeptPhotos] = useState(existing);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<UploadedPhoto[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  function removeExisting(id: string) {
    setKeptPhotos((prev) => prev.filter((p) => p.id !== id));
    setDeletedIds((prev) => [...prev, id]);
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);
    const fd = new FormData(e.currentTarget);
    const whatsapp = normalizeDrcPhone(String(fd.get("whatsapp_number") ?? ""));
    if (!whatsapp) return setProfileMsg("Numéro WhatsApp invalide.");
    setSavingProfile(true);
    const res = await updateMyWorkerProfile({
      profile: {
        profession_id: fd.get("profession_id"),
        location_id: fd.get("location_id"),
        headline: fd.get("headline"),
        bio: fd.get("bio"),
        years_experience: fd.get("years_experience"),
        whatsapp_number: whatsapp,
        hourly_rate_min: fd.get("hourly_rate_min") || undefined,
        hourly_rate_max: fd.get("hourly_rate_max") || undefined,
      },
      newPhotos,
      deletedPhotoIds: deletedIds,
    });
    setSavingProfile(false);
    if (!res.ok) return setProfileMsg(res.error ?? "Erreur");
    setProfileMsg("✓ Profil mis à jour. Il sera revérifié avant publication.");
    setNewPhotos([]);
    setDeletedIds([]);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Identity + quick links */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{account.fullName || "Mon compte"}</h2>
            <p className="text-sm text-gray-500">
              {account.email || account.phone || ""}
              {account.role && <> · {account.role === "worker" ? "Fundi" : "Client"}</>}
            </p>
          </div>
          <Link href="/messages" className="btn-primary">Mes messages</Link>
        </div>

        <form onSubmit={saveName} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="name">Nom affiché</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button className="btn-ghost" disabled={savingName}>{savingName ? "…" : "Enregistrer"}</button>
        </form>
        {nameMsg && <p className="mt-1 text-sm text-gray-500">{nameMsg}</p>}
      </div>

      {/* Worker profile */}
      {worker ? (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Mon profil fundi</h3>
            {worker.status && (
              <Badge variant={STATUS_LABEL[worker.status]?.variant ?? "neutral"}>
                {STATUS_LABEL[worker.status]?.label ?? worker.status}
              </Badge>
            )}
          </div>
          {worker.status === "rejected" && worker.rejection_reason && (
            <p className="mb-3 text-sm text-danger">Raison du rejet : {worker.rejection_reason}</p>
          )}

          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="profession_id">Métier</label>
                <select id="profession_id" name="profession_id" className="input" defaultValue={worker.profession_id} required>
                  {professions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_fr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="commune_id">Commune</label>
                <select id="commune_id" className="input" value={communeId} onChange={(e) => setCommuneId(e.target.value)} required>
                  <option value="">Choisir…</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="location_id">Quartier</label>
              <select id="location_id" name="location_id" className="input" defaultValue={worker.location_id} required disabled={!communeId}>
                <option value="">Choisir…</option>
                {quartierOptions.map((q) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="headline">Titre</label>
              <input id="headline" name="headline" className="input" defaultValue={worker.headline} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="years_experience">Années d&apos;expérience</label>
                <input id="years_experience" name="years_experience" type="number" min={0} max={70} className="input" defaultValue={worker.years_experience ?? 0} required />
              </div>
              <div>
                <label className="label" htmlFor="whatsapp_number">Numéro WhatsApp</label>
                <input id="whatsapp_number" name="whatsapp_number" type="tel" className="input" defaultValue={worker.whatsapp_number} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="hourly_rate_min">Tarif min (FC)</label>
                <input id="hourly_rate_min" name="hourly_rate_min" type="number" min={0} className="input" defaultValue={worker.hourly_rate_min ?? ""} required />
              </div>
              <div>
                <label className="label" htmlFor="hourly_rate_max">Tarif max (FC)</label>
                <input id="hourly_rate_max" name="hourly_rate_max" type="number" min={0} className="input" defaultValue={worker.hourly_rate_max ?? ""} required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="bio">Présentation</label>
              <textarea id="bio" name="bio" className="input" rows={3} minLength={20} maxLength={1500} defaultValue={worker.bio ?? ""} required />
            </div>

            <div>
              <span className="label">Portfolio — photos de vos travaux</span>
              {keptPhotos.length > 0 && (
                <div className="mb-2 grid grid-cols-3 gap-2">
                  {keptPhotos.map((p) => (
                    <div key={p.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="h-24 w-full rounded-lg object-cover" loading="lazy" />
                      <button type="button" onClick={() => removeExisting(p.id)}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white" aria-label="Supprimer">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <PhotoUploader value={newPhotos} onChange={setNewPhotos} />
            </div>

            <button className="btn-gradient w-full" disabled={savingProfile}>
              {savingProfile ? "Enregistrement…" : "Enregistrer mon profil"}
            </button>
            {profileMsg && <p className="text-sm text-gray-600">{profileMsg}</p>}
          </form>
        </div>
      ) : (
        <div className="card flex flex-col items-start gap-3 bg-brand-gradient-vivid p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Vous êtes un fundi ?</h3>
            <p className="text-blue-50">Créez votre profil pour recevoir des clients.</p>
          </div>
          <Link href="/rejoindre" className="btn bg-white font-semibold text-brand">Devenir fundi</Link>
        </div>
      )}
    </div>
  );
}
