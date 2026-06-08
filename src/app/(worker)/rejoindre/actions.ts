"use server";

import { createClient } from "@/lib/supabase/server";
import { workerProfileSchema, workerPhotoMetaSchema } from "@/lib/validations/worker";

export interface CreateProfileResult {
  ok: boolean;
  error?: string;
  workerId?: string;
}

/**
 * Create a worker profile for the currently authenticated user.
 * Profile is created with status='pending' (RLS: owner insert).
 */
export async function createWorkerProfile(input: {
  profile: unknown;
  photos: unknown[];
}): Promise<CreateProfileResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const parsed = workerProfileSchema.safeParse(input.profile);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide. Vérifiez les champs." };
  }
  const p = parsed.data;

  // At least one portfolio photo is required.
  if (!Array.isArray(input.photos) || input.photos.length < 1) {
    return { ok: false, error: "Ajoutez au moins une photo de vos travaux (portfolio)." };
  }

  // 1) upsert the user profile row (1:1 with auth user)
  const { error: userErr } = await supabase.from("users").upsert(
    {
      id: user.id,
      role: "worker",
      full_name: p.full_name,
      phone: p.phone,
      whatsapp_number: p.whatsapp_number,
      email: user.email ?? null,
      // verified only when they came through phone OTP (phone === auth phone)
      is_phone_verified: !!user.phone && `+${user.phone.replace(/[^\d]/g, "")}` === p.phone,
    },
    { onConflict: "id" },
  );
  if (userErr) return { ok: false, error: "Impossible d'enregistrer votre compte." };

  // 2) create the worker profile (pending)
  const { data: worker, error: workerErr } = await supabase
    .from("workers")
    .insert({
      user_id: user.id,
      profession_id: p.profession_id,
      location_id: p.location_id,
      headline: p.headline,
      bio: p.bio || null,
      years_experience: p.years_experience,
      service_areas: p.service_areas ?? null,
      hourly_rate_min: p.hourly_rate_min,
      hourly_rate_max: p.hourly_rate_max,
      whatsapp_number: p.whatsapp_number,
      // Profile is complete (all fields + a photo are required) -> active & approved.
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (workerErr || !worker) {
    return { ok: false, error: "Impossible de créer le profil (déjà existant ?)." };
  }

  // 3) attach photos (validated)
  const photos = input.photos
    .map((ph) => workerPhotoMetaSchema.safeParse(ph))
    .filter((r) => r.success)
    .map((r, idx) => {
      const d = (r as { data: ReturnType<typeof workerPhotoMetaSchema.parse> }).data;
      return {
        worker_id: worker.id,
        storage_path: d.storage_path,
        url: d.url,
        type: d.type,
        width: d.width ?? null,
        height: d.height ?? null,
        caption: d.caption ?? null,
        sort_order: idx,
        is_primary: idx === 0,
      };
    });

  if (photos.length > 0) {
    await supabase.from("worker_photos").insert(photos);
  }

  return { ok: true, workerId: worker.id };
}
