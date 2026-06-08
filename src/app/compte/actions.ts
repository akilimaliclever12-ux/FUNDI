"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { workerEditSchema, workerPhotoMetaSchema } from "@/lib/validations/worker";
import { PHOTOS_BUCKET } from "@/lib/storage";

interface Result {
  ok: boolean;
  error?: string;
}

/** Update the signed-in user's display name. */
export async function updateMyName(fullName: string): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const name = fullName.trim();
  if (name.length < 2) return { ok: false, error: "Nom requis." };

  const { error } = await supabase.from("users").update({ full_name: name }).eq("id", user.id);
  if (error) return { ok: false, error: "Enregistrement échoué." };
  revalidatePath("/compte");
  return { ok: true };
}

/**
 * Update the signed-in worker's own profile (text fields) + manage photos.
 * Editing puts the profile back to `pending` for re-approval.
 */
export async function updateMyWorkerProfile(input: {
  profile: unknown;
  newPhotos: unknown[];
  deletedPhotoIds: string[];
}): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: worker } = await supabase
    .from("workers")
    .select("id, status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!worker) return { ok: false, error: "Profil introuvable." };

  const parsed = workerEditSchema.safeParse(input.profile);
  if (!parsed.success) return { ok: false, error: "Formulaire invalide." };
  const p = parsed.data;

  // A complete profile must keep at least one portfolio photo.
  const { count: currentPhotos } = await supabase
    .from("worker_photos")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", worker.id)
    .neq("type", "verification");
  const finalCount =
    (currentPhotos ?? 0) - (input.deletedPhotoIds?.length ?? 0) + (input.newPhotos?.length ?? 0);
  if (finalCount < 1) {
    return { ok: false, error: "Gardez au moins une photo dans votre portfolio." };
  }

  const { error: upErr } = await supabase
    .from("workers")
    .update({
      profession_id: p.profession_id,
      location_id: p.location_id,
      headline: p.headline,
      bio: p.bio,
      years_experience: p.years_experience,
      whatsapp_number: p.whatsapp_number,
      hourly_rate_min: p.hourly_rate_min,
      hourly_rate_max: p.hourly_rate_max,
      // stays active; only the admin can suspend/reject
    })
    .eq("id", worker.id);
  if (upErr) return { ok: false, error: "Mise à jour échouée." };

  // delete removed photos (rows owned via RLS) + storage objects (service role)
  if (input.deletedPhotoIds.length) {
    const { data: toDelete } = await supabase
      .from("worker_photos")
      .select("id, storage_path")
      .in("id", input.deletedPhotoIds);
    await supabase.from("worker_photos").delete().in("id", input.deletedPhotoIds);
    const paths = (toDelete ?? []).map((x) => x.storage_path).filter(Boolean) as string[];
    if (paths.length) {
      try {
        await createAdminClient().storage.from(PHOTOS_BUCKET).remove(paths);
      } catch {
        // best-effort; ignore storage cleanup failures
      }
    }
  }

  // add new photos
  const newPhotos = input.newPhotos
    .map((ph) => workerPhotoMetaSchema.safeParse(ph))
    .filter((r) => r.success)
    .map((r) => (r as { data: ReturnType<typeof workerPhotoMetaSchema.parse> }).data);
  if (newPhotos.length) {
    await supabase.from("worker_photos").insert(
      newPhotos.map((d, i) => ({
        worker_id: worker.id,
        storage_path: d.storage_path,
        url: d.url,
        type: d.type,
        width: d.width ?? null,
        height: d.height ?? null,
        sort_order: 100 + i,
      })),
    );
  }

  revalidatePath("/compte");
  revalidatePath(`/workers/${worker.id}`);
  revalidatePath("/workers");
  return { ok: true };
}
