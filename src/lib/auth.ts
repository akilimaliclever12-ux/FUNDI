import { createClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "@/types/database.types";

/** Returns the active admin row for the current session, or null. */
export async function getCurrentAdmin(): Promise<AdminUserRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  return (data as AdminUserRow) ?? null;
}
