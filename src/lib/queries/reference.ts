import { createClient } from "@/lib/supabase/server";
import type { ProfessionRow, LocationRow } from "@/types/database.types";

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
