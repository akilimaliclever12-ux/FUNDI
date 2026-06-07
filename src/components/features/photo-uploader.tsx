"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PHOTOS_BUCKET } from "@/lib/storage";

export interface UploadedPhoto {
  storage_path: string;
  url: string;
  width?: number;
  height?: number;
}

const MAX_FILES = 6;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIM = 1280; // downscale longest side — low-bandwidth friendly
const JPEG_QUALITY = 0.75;

/** Resize/compress an image File in the browser before upload. */
async function compressImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, width, height };
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", JPEG_QUALITY),
  );
  return { blob, width, height };
}

/**
 * Upload flow: compress -> ask our server for a signed Supabase upload URL ->
 * upload directly to Supabase Storage -> keep the public URL.
 */
export function PhotoUploader({
  value,
  onChange,
}: {
  value: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    if (value.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} photos.`);
      return;
    }

    setBusy(true);
    try {
      const uploaded: UploadedPhoto[] = [];
      let i = 0;
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setError("Chaque photo doit faire moins de 5 Mo.");
          continue;
        }

        // 1) compress in-browser
        const { blob, width, height } = await compressImage(file);

        // 2) get a signed upload URL from our server
        const signRes = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ext: "jpg", index: value.length + i }),
        });
        if (!signRes.ok) throw new Error("sign failed");
        const { path, token, publicUrl } = await signRes.json();

        // 3) upload directly to Supabase Storage via the signed token
        const { error: upErr } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .uploadToSignedUrl(path, token, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;

        uploaded.push({ storage_path: path, url: publicUrl, width, height });
        i++;
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError("Échec du téléversement. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {value.map((p, i) => (
          <div key={p.storage_path} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={`Photo ${i + 1}`}
              className="h-24 w-full rounded-lg object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white"
              aria-label="Supprimer la photo"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {value.length < MAX_FILES && (
        <label className="btn-ghost w-full cursor-pointer">
          {busy ? "Téléversement…" : "+ Ajouter des photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-gray-400">
        JPG/PNG, max {MAX_FILES} photos. Les images sont compressées automatiquement.
      </p>
    </div>
  );
}
