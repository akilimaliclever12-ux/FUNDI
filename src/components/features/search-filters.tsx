"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProfessionRow, LocationRow } from "@/types/database.types";

export function SearchFilters({
  professions,
  locations,
}: {
  professions: Pick<ProfessionRow, "slug" | "name_fr">[];
  locations: Pick<LocationRow, "slug" | "name" | "type">[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.delete("page"); // reset pagination on filter change
    startTransition(() => router.push(`/workers?${sp.toString()}`));
  }

  return (
    <div className="card p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (ex: dépannage, toiture…)"
            className="input"
            aria-label="Mot-clé"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={isPending}>
            Chercher
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            className="input"
            aria-label="Métier"
            defaultValue={params.get("profession") ?? ""}
            onChange={(e) => apply({ profession: e.target.value })}
          >
            <option value="">Tous les métiers</option>
            {professions.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name_fr}
              </option>
            ))}
          </select>

          <select
            className="input"
            aria-label="Quartier"
            defaultValue={params.get("location") ?? ""}
            onChange={(e) => apply({ location: e.target.value })}
          >
            <option value="">Tous les quartiers</option>
            {locations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.type === "quartier" ? "— " : ""}
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
}
