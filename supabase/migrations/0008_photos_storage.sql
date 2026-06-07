-- 0008_photos_storage.sql
-- Move worker photos from Cloudinary to Supabase Storage.
-- The bucket "worker-photos" is created via scripts/setup-storage.mjs
-- (service role). Here we just rename the column to reflect the new source.

alter table public.worker_photos
  rename column cloudinary_public_id to storage_path;
