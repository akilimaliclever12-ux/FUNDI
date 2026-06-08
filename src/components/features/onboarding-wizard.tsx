"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { createWorkerProfile } from "@/app/(worker)/rejoindre/actions";
import type { ProfessionRow } from "@/types/database.types";
import type { CommuneNode } from "@/types";

type Step = "phone" | "otp" | "profile" | "done";

export function OnboardingWizard({
  professions,
  communes,
}: {
  professions: Pick<ProfessionRow, "id" | "name_fr">[];
  communes: CommuneNode[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quartierOptions = communes.find((c) => c.id === communeId)?.quartiers ?? [];

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return setError("Envoi du code échoué. Vérifiez le numéro.");
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    if (error) return setError("Code incorrect. Réessayez.");
    setStep("profile");
  }

  async function submitProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const profile = {
      full_name: fd.get("full_name"),
      phone,
      whatsapp_number: fd.get("whatsapp_number") || phone,
      profession_id: fd.get("profession_id"),
      location_id: fd.get("location_id"),
      headline: fd.get("headline"),
      bio: fd.get("bio"),
      years_experience: fd.get("years_experience"),
      hourly_rate_min: fd.get("hourly_rate_min") || undefined,
      hourly_rate_max: fd.get("hourly_rate_max") || undefined,
    };
    const res = await createWorkerProfile({ profile, photos });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Erreur.");
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="card p-6 text-center">
        <div className="text-3xl">🎉</div>
        <h2 className="mt-2 text-xl font-bold text-ink">Profil envoyé !</h2>
        <p className="mt-1 text-gray-600">
          Votre profil est en cours de vérification. Vous serez visible dès qu&apos;il est approuvé.
        </p>
        <button onClick={() => router.push("/")} className="btn-primary mt-4">
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-6">
      <Steps current={step} />

      {step === "phone" && (
        <form onSubmit={sendOtp} className="space-y-3">
          <div>
            <label className="label" htmlFor="phone">Votre numéro de téléphone</label>
            <input
              id="phone"
              className="input"
              placeholder="+243…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button className="btn-gradient w-full" disabled={busy}>
            {busy ? "Envoi…" : "Recevoir le code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-3">
          <div>
            <label className="label" htmlFor="otp">Code reçu par SMS</label>
            <input
              id="otp"
              className="input tracking-widest"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <button className="btn-gradient w-full" disabled={busy}>
            {busy ? "Vérification…" : "Vérifier"}
          </button>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={submitProfile} className="space-y-3">
          <div>
            <label className="label" htmlFor="full_name">Nom complet</label>
            <input id="full_name" name="full_name" className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="profession_id">Métier</label>
              <select id="profession_id" name="profession_id" className="input" required>
                <option value="">Choisir…</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_fr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="commune_id">Commune</label>
              <select
                id="commune_id"
                className="input"
                required
                value={communeId}
                onChange={(e) => setCommuneId(e.target.value)}
              >
                <option value="">Choisir…</option>
                {communes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location_id">Quartier</label>
            <select
              id="location_id"
              name="location_id"
              className="input disabled:bg-gray-50 disabled:text-gray-400"
              required
              disabled={!communeId}
            >
              <option value="">{communeId ? "Choisir…" : "Choisissez d'abord une commune"}</option>
              {quartierOptions.map((qt) => (
                <option key={qt.id} value={qt.id}>{qt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="headline">Titre (une phrase)</label>
            <input
              id="headline"
              name="headline"
              className="input"
              placeholder="Ex: Électricien certifié, dépannage rapide"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="years_experience">Années d&apos;expérience</label>
              <input id="years_experience" name="years_experience" type="number" min={0} max={70} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp_number">Numéro WhatsApp</label>
              <input id="whatsapp_number" name="whatsapp_number" className="input" placeholder={phone} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="hourly_rate_min">Tarif min (FC)</label>
              <input id="hourly_rate_min" name="hourly_rate_min" type="number" min={0} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="hourly_rate_max">Tarif max (FC)</label>
              <input id="hourly_rate_max" name="hourly_rate_max" type="number" min={0} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Présentation</label>
            <textarea id="bio" name="bio" className="input" rows={3} maxLength={1500} />
          </div>
          <div>
            <span className="label">Photos de vos travaux</span>
            <PhotoUploader value={photos} onChange={setPhotos} />
          </div>
          <button className="btn-gradient w-full" disabled={busy}>
            {busy ? "Envoi…" : "Créer mon profil"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const order: Step[] = ["phone", "otp", "profile"];
  const idx = order.indexOf(current);
  const labels = ["Téléphone", "Code", "Profil"];
  return (
    <ol className="flex gap-2 text-xs">
      {labels.map((l, i) => (
        <li
          key={l}
          className={`flex-1 rounded-full px-2 py-1 text-center ${
            i <= idx ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {l}
        </li>
      ))}
    </ol>
  );
}
