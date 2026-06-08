"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ProfessionRow } from "@/types/database.types";
import type { CommuneNode } from "@/types";

export function SearchFilters({
  professions,
  communes,
}: {
  professions: Pick<ProfessionRow, "slug" | "name_fr">[];
  communes: CommuneNode[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const selectedCommune = params.get("commune") ?? "";
  const selectedQuartier = params.get("quartier") ?? "";
  const communeObj = communes.find((c) => c.slug === selectedCommune);
  const quartierOptions = communeObj?.quartiers ?? [];

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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

          {/* Commune — choosing one resets the quartier */}
          <select
            className="input"
            aria-label="Commune"
            value={selectedCommune}
            onChange={(e) => apply({ commune: e.target.value, quartier: "" })}
          >
            <option value="">Toutes les communes</option>
            {communes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Quartier — depends on the chosen commune */}
          <select
            className="input disabled:bg-gray-50 disabled:text-gray-400"
            aria-label="Quartier"
            value={selectedQuartier}
            disabled={!selectedCommune}
            onChange={(e) => apply({ quartier: e.target.value })}
          >
            <option value="">
              {selectedCommune ? "Tous les quartiers" : "Choisir une commune"}
            </option>
            {quartierOptions.map((qt) => (
              <option key={qt.slug} value={qt.slug}>
                {qt.name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
}
