"use client";

import { useState } from "react";

export interface UploadedPhoto {
  cloudinary_public_id: string;
  url: string;
  width?: number;
  height?: number;
}

const MAX_FILES = 6;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Signed direct-to-Cloudinary upload. Asks our server to sign, then uploads
 * straight to Cloudinary so large files never pass through our server.
 */
export function PhotoUploader({
  value,
  onChange,
}: {
  value: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}) {
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
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setError("Chaque photo doit faire moins de 5 Mo.");
          continue;
        }
        // 1) get a signature from our server
        const signRes = await fetch("/api/upload/sign", { method: "POST" });
        if (!signRes.ok) throw new Error("sign failed");
        const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

        // 2) upload directly to Cloudinary
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", apiKey);
        form.append("timestamp", String(timestamp));
        form.append("signature", signature);
        form.append("folder", folder);

        const up = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form },
        );
        if (!up.ok) throw new Error("upload failed");
        const data = await up.json();
        uploaded.push({
          cloudinary_public_id: data.public_id,
          url: data.secure_url,
          width: data.width,
          height: data.height,
        });
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
          <div key={p.cloudinary_public_id} className="relative">
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
      <p className="text-xs text-gray-400">JPG/PNG, max {MAX_FILES} photos, 5 Mo chacune.</p>
    </div>
  );
}
