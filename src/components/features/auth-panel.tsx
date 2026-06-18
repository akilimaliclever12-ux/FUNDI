"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyProfileState, ensureCustomerProfile } from "@/app/connexion/actions";
import { normalizeDrcPhone } from "@/lib/phone";
import { SMS_ENABLED } from "@/lib/config";
import { cn } from "@/lib/utils";

type Method = "phone" | "email";
type Step = "role" | "auth" | "otp" | "name";

export function AuthPanel({ next = "/messages" }: { next?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [method, setMethod] = useState<Method>(SMS_ENABLED ? "phone" : "email");
  const [step, setStep] = useState<Step>("role");
  const [emailMode, setEmailMode] = useState<"login" | "signup">("login");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  /** After any successful auth: go to name step if no profile, else redirect. */
  async function afterAuth() {
    const state = await getMyProfileState();
    setBusy(false);
    if (state.ok && state.hasProfile) {
      router.push(next);
      router.refresh();
    } else {
      setStep("name");
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeDrcPhone(phone);
    if (!normalized) {
      return setError("Numéro invalide. Exemple : 097 000 0000");
    }
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
    if (error) {
      setBusy(false);
      return setError("Code incorrect. Réessayez.");
    }
    await afterAuth();
  }

  async function emailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    if (emailMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setBusy(false);
        return setError("Email ou mot de passe incorrect.");
      }
      await afterAuth();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setBusy(false);
        return setError(error.message || "Création du compte échouée.");
      }
      // Email already exists -> Supabase returns user with empty identities + no session.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setBusy(false);
        setEmailMode("login");
        return setError("Un compte existe déjà avec cet email. Connectez-vous.");
      }
      if (!data.session) {
        // Only if email confirmation is ON in Supabase.
        setBusy(false);
        setInfo("Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.");
        setEmailMode("login");
        return;
      }
      await afterAuth();
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return setError("Vous devez accepter les Conditions Générales.");
    setBusy(true);
    setError(null);
    const res = await ensureCustomerProfile(name);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Erreur.");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="card space-y-4 p-5">
      {step === "role" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Vous êtes ?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStep("auth")}
              className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 p-4 text-center hover:border-brand/50 hover:bg-gray-50"
            >
              <span className="text-2xl">🙋</span>
              <span className="font-semibold text-ink">Client</span>
              <span className="text-xs text-gray-500">Je cherche un fundi</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/rejoindre")}
              className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200 p-4 text-center hover:border-accent/50 hover:bg-gray-50"
            >
              <span className="text-2xl">🔧</span>
              <span className="font-semibold text-ink">Fundi</span>
              <span className="text-xs text-gray-500">Je propose mes services</span>
            </button>
          </div>
        </div>
      )}

      {step === "auth" && (
        <>
          {/* method tabs — phone only shown when SMS is configured */}
          {SMS_ENABLED && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setMethod("phone"); setError(null); }}
                className={cn("rounded-lg py-2", method === "phone" ? "bg-white text-ink shadow-sm" : "text-gray-500")}
              >
                Téléphone
              </button>
              <button
                type="button"
                onClick={() => { setMethod("email"); setError(null); }}
                className={cn("rounded-lg py-2", method === "email" ? "bg-white text-ink shadow-sm" : "text-gray-500")}
              >
                Email
              </button>
            </div>
          )}

          {method === "phone" && SMS_ENABLED && (
            <form onSubmit={sendOtp} className="space-y-3">
              <div>
                <label className="label" htmlFor="phone">Numéro de téléphone</label>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="input"
                  placeholder="097 000 0000" value={phone}
                  onChange={(e) => setPhone(e.target.value)} required />
                <p className="mt-1 text-xs text-gray-400">Numéro RDC. Un code vous sera envoyé par SMS.</p>
              </div>
              <button className="btn-gradient w-full" disabled={busy}>
                {busy ? "Envoi…" : "Recevoir le code"}
              </button>
            </form>
          )}

          {method === "email" && (
            <form onSubmit={emailSubmit} className="space-y-3">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="password">Mot de passe</label>
                <input id="password" type="password" className="input" minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn-gradient w-full" disabled={busy}>
                {busy ? "…" : emailMode === "login" ? "Se connecter" : "Créer un compte"}
              </button>
              <button
                type="button"
                onClick={() => { setEmailMode(emailMode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}
                className="w-full text-center text-sm text-brand hover:underline"
              >
                {emailMode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
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

      {step === "name" && (
        <form onSubmit={saveName} className="space-y-3">
          <div>
            <label className="label" htmlFor="name">Votre nom</label>
            <input id="name" className="input" value={name}
              onChange={(e) => setName(e.target.value)} required />
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
            {busy ? "…" : "Continuer"}
          </button>
        </form>
      )}

      {info && <p className="text-sm text-green-700">{info}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
