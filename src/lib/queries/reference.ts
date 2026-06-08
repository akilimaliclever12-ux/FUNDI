import { createClient } from "@/lib/supabase/server";
import type { ProfessionRow, LocationRow } from "@/types/database.types";
import type { CommuneNode } from "@/types";

export async function getProfessions(): Promise<ProfessionRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("professions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getLocations(): Promise<LocationRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("type")
    .order("name");
  return data ?? [];
}

/** Communes with their nested quartiers, for cascading dropdowns. */
export async function getCommunes(): Promise<CommuneNode[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("id, slug, name, type, parent_id")
    .eq("is_active", true)
    .in("type", ["commune", "quartier"])
    .order("name");

  const rows = data ?? [];
  const communes = rows.filter((l) => l.type === "commune");
  const quartiers = rows.filter((l) => l.type === "quartier");

  return communes.map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    quartiers: quartiers
      .filter((q) => q.parent_id === c.id)
      .map((q) => ({ id: q.id as string, slug: q.slug as string, name: q.name as string })),
  }));
}
