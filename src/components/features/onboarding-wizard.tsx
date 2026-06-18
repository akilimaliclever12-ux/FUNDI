"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { createWorkerProfile } from "@/app/(worker)/rejoindre/actions";
import { signUpConfirmed } from "@/app/connexion/actions";
import { normalizeDrcPhone } from "@/lib/phone";
import { SMS_ENABLED } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ProfessionRow } from "@/types/database.types";
import type { CommuneNode } from "@/types";

type Step = "auth" | "otp" | "profile" | "done";
type Method = "email" | "phone";

export function OnboardingWizard({
  professions,
  communes,
  alreadyAuthed = false,
}: {
  professions: Pick<ProfessionRow, "id" | "name_fr">[];
  communes: CommuneNode[];
  alreadyAuthed?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  // Logged-in users (e.g. a customer becoming a fundi) skip straight to the profile.
  const [step, setStep] = useState<Step>(alreadyAuthed ? "profile" : "auth");
  const [method, setMethod] = useState<Method>(SMS_ENABLED ? "phone" : "email");
  const [emailMode, setEmailMode] = useState<"signup" | "login">("signup");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authedPhone, setAuthedPhone] = useState<string | null>(null);

  const [communeId, setCommuneId] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const quartierOptions = communes.find((c) => c.id === communeId)?.quartiers ?? [];

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeDrcPhone(phone);
    if (!normalized) return setError("Numéro invalide. Exemple : 097 000 0000");
    setPhone(normalized);
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) return setError("Envoi du code échoué. Réessayez dans un instant.");
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    if (error) return setError("Code incorrect. Réessayez.");
    setAuthedPhone(phone);
    setStep("profile");
  }

  async function emailAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (emailMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError("Email ou mot de passe incorrect.");
      setStep("profile");
    } else {
      // Create an already-confirmed account server-side, then sign in.
      const res = await signUpConfirmed(email, password);
      if (!res.ok) {
        setBusy(false);
        if (res.exists) setEmailMode("login");
        return setError(res.error ?? "Création du compte échouée.");
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signInErr) {
        setEmailMode("login");
        return setError("Compte créé. Connectez-vous.");
      }
      setStep("profile");
    }
  }

  async function submitProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const whatsappRaw = String(fd.get("whatsapp_number") ?? "");
    const whatsapp = normalizeDrcPhone(whatsappRaw);
    if (!whatsapp) {
      return setError("Numéro WhatsApp invalide. Exemple : 097 000 0000");
    }
    if (photos.length < 1) {
      return setError("Ajoutez au moins une photo dans votre portfolio.");
    }
    if (!agreed) {
      return setError("Vous devez accepter les Conditions Générales.");
    }
    setBusy(true);
    const profile = {
      full_name: fd.get("full_name"),
      // users.phone: verified OTP phone if available, else the WhatsApp number
      phone: authedPhone ?? whatsapp,
      whatsapp_number: whatsapp,
      profession_id: fd.get("profession_id"),
      location_id: fd.get("location_id"),
      headline: fd.get("headline"),
      bio: fd.get("bio"),
      years_experience: fd.get("years_experience"),
      hourly_rate_min: fd.get("hourly_rate_min"),
      hourly_rate_max: fd.get("hourly_rate_max"),
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
        <h2 className="mt-2 text-xl font-bold text-ink">Profil actif !</h2>
        <p className="mt-1 text-gray-600">
          Félicitations, votre profil est en ligne et visible par les clients. Ajoutez vos
          certifications, diplômes et références depuis votre compte pour inspirer plus confiance.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => router.push("/compte")} className="btn-primary">
            Compléter mon profil
          </button>
          <button onClick={() => router.push("/")} className="btn-ghost">
            Accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-6">
      <Steps current={step} />

      {step === "auth" && (
        <>
          {SMS_ENABLED && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-medium">
              <button type="button" onClick={() => { setMethod("phone"); setError(null); }}
                className={cn("rounded-lg py-2", method === "phone" ? "bg-white text-ink shadow-sm" : "text-gray-500")}>
                Téléphone
              </button>
              <button type="button" onClick={() => { setMethod("email"); setError(null); }}
                className={cn("rounded-lg py-2", method === "email" ? "bg-white text-ink shadow-sm" : "text-gray-500")}>
                Email
              </button>
            </div>
          )}

          {method === "phone" && SMS_ENABLED && (
            <form onSubmit={sendOtp} className="space-y-3">
              <div>
                <label className="label" htmlFor="phone">Votre numéro de téléphone</label>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="input"
                  placeholder="097 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <p className="mt-1 text-xs text-gray-400">Numéro RDC. Un code vous sera envoyé par SMS.</p>
              </div>
              <button className="btn-gradient w-full" disabled={busy}>
                {busy ? "Envoi…" : "Recevoir le code"}
              </button>
            </form>
          )}

          {method === "email" && (
            <form onSubmit={emailAuth} className="space-y-3">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="password">Mot de passe</label>
                <input id="password" type="password" minLength={6} className="input" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn-gradient w-full" disabled={busy}>
                {busy ? "…" : emailMode === "signup" ? "Créer mon compte" : "Se connecter"}
              </button>
              <button type="button"
                onClick={() => { setEmailMode(emailMode === "signup" ? "login" : "signup"); setError(null); setInfo(null); }}
                className="w-full text-center text-sm text-brand hover:underline">
                {emailMode === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un compte"}
              </button>
            </form>
          )}
        </>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-3">
          <div>
            <label className="label" htmlFor="otp">Code reçu par SMS</label>
            <input id="otp" className="input tracking-widest" inputMode="numeric" value={otp}
              onChange={(e) => setOtp(e.target.value)} required />
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
              <select id="commune_id" className="input" required value={communeId}
                onChange={(e) => setCommuneId(e.target.value)}>
                <option value="">Choisir…</option>
                {communes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location_id">Quartier</label>
            <select id="location_id" name="location_id"
              className="input disabled:bg-gray-50 disabled:text-gray-400" required disabled={!communeId}>
              <option value="">{communeId ? "Choisir…" : "Choisissez d'abord une commune"}</option>
              {quartierOptions.map((qt) => (
                <option key={qt.id} value={qt.id}>{qt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="headline">Titre (une phrase)</label>
            <input id="headline" name="headline" className="input"
              placeholder="Ex: Électricien certifié, dépannage rapide" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="years_experience">Années d&apos;expérience</label>
              <input id="years_experience" name="years_experience" type="number" min={0} max={70} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp_number">Numéro WhatsApp</label>
              <input id="whatsapp_number" name="whatsapp_number" type="tel" inputMode="tel" className="input"
                placeholder="097 000 0000" defaultValue={authedPhone ?? ""} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="hourly_rate_min">Tarif min (FC)</label>
              <input id="hourly_rate_min" name="hourly_rate_min" type="number" min={0} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="hourly_rate_max">Tarif max (FC)</label>
              <input id="hourly_rate_max" name="hourly_rate_max" type="number" min={0} className="input" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Présentation</label>
            <textarea id="bio" name="bio" className="input" rows={3} minLength={20} maxLength={1500} required />
          </div>
          <div>
            <span className="label">Portfolio — photos de vos travaux (obligatoire)</span>
            <PhotoUploader value={photos} onChange={setPhotos} />
            <p className="mt-1 text-xs text-gray-400">Au moins 1 photo. Un portfolio attire plus de clients.</p>
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              J&apos;accepte les{" "}
              <a href="/conditions" target="_blank" rel="noopener noreferrer" className="text-brand underline">
                Conditions Générales d&apos;Utilisation
              </a>
              .
            </span>
          </label>
          <button className="btn-gradient w-full" disabled={busy || !agreed}>
            {busy ? "Envoi…" : "Créer mon profil"}
          </button>
        </form>
      )}

      {info && <p className="text-sm text-green-700">{info}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const order: Step[] = ["auth", "otp", "profile"];
  const activeIdx = current === "otp" ? 1 : current === "profile" ? 2 : 0;
  const labels = ["Compte", "Code", "Profil"];
  return (
    <ol className="flex gap-2 text-xs">
      {labels.map((l, i) => {
        // hide the "Code" step label when SMS is off (email flow skips it)
        if (i === 1 && !SMS_ENABLED) return null;
        return (
          <li key={l}
            className={cn(
              "flex-1 rounded-full px-2 py-1 text-center",
              i <= activeIdx ? "bg-brand text-white" : "bg-gray-100 text-gray-500",
            )}>
            {l}
          </li>
        );
      })}
    </ol>
  );
}
