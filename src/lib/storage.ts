// Supabase Storage helpers for worker photos.

export const PHOTOS_BUCKET = "worker-photos";

/** Build a unique object path for a user's upload. */
export function buildPhotoPath(userId: string, ext: string, index = 0): string {
  // Date.now is fine here (runs in a route handler, not a workflow script).
  const stamp = Date.now();
  const safeExt = (ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${userId}/${stamp}-${index}.${safeExt}`;
}

/** Public URL for an object in the photos bucket. */
export function publicPhotoUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PHOTOS_BUCKET}/${path}`;
}
