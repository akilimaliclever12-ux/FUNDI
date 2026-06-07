"use client";

import { useState } from "react";

export function ReviewForm({ workerId }: { workerId: string }) {
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      worker_id: workerId,
      author_name: String(fd.get("author_name") ?? ""),
      author_phone: String(fd.get("author_phone") ?? ""),
      rating,
      comment: String(fd.get("comment") ?? ""),
    };
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Impossible d'envoyer l'avis. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-4 text-sm text-green-700">
        Merci ! Votre avis a été envoyé et sera publié après vérification.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <h3 className="font-semibold text-ink">Laisser un avis</h3>

      <div>
        <span className="label">Note</span>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} étoiles`}
              className={n <= rating ? "text-amber-500" : "text-gray-300"}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="author_name">Votre nom</label>
        <input id="author_name" name="author_name" className="input" required maxLength={80} />
      </div>

      <div>
        <label className="label" htmlFor="author_phone">Téléphone (optionnel)</label>
        <input id="author_phone" name="author_phone" className="input" placeholder="+243…" />
      </div>

      <div>
        <label className="label" htmlFor="comment">Commentaire</label>
        <textarea id="comment" name="comment" className="input" rows={3} maxLength={800} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Envoi…" : "Envoyer l'avis"}
      </button>
    </form>
  );
}
