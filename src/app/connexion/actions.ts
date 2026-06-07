"use server";

import { createClient } from "@/lib/supabase/server";

export interface EnsureResult {
  ok: boolean;
  error?: string;
  hasProfile?: boolean;
}

/** Does the signed-in user already have a profile row? */
export async function getMyProfileState(): Promise<EnsureResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { ok: true, hasProfile: !!data?.full_name };
}

/** Create/refresh the customer profile row after phone-OTP login. */
export async function ensureCustomerProfile(fullName: string): Promise<EnsureResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const name = fullName.trim();
  if (name.length < 2) return { ok: false, error: "Nom requis." };

  const email = user.email ?? null;
  const realPhone = user.phone ? `+${user.phone.replace(/[^\d]/g, "")}` : null;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    // Update only what we know — never overwrite a real phone with a placeholder
    // or downgrade an existing worker's role.
    const patch: Record<string, unknown> = { full_name: name };
    if (email) patch.email = email;
    if (realPhone) {
      patch.phone = realPhone;
      patch.is_phone_verified = true;
    }
    const { error } = await supabase.from("users").update(patch).eq("id", user.id);
    if (error) return { ok: false, error: "Impossible d'enregistrer le profil." };
  } else {
    const { error } = await supabase.from("users").insert({
      id: user.id,
      full_name: name,
      email,
      // phone is NOT NULL; use a unique placeholder for email-only accounts
      phone: realPhone ?? `pending-${user.id.slice(0, 8)}`,
      is_phone_verified: !!realPhone,
    });
    if (error) return { ok: false, error: "Impossible d'enregistrer le profil." };
  }

  return { ok: true, hasProfile: true };
}
