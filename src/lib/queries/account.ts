import { createClient } from "@/lib/supabase/server";
import type { WorkerWithRelations } from "@/types";

export interface Account {
  userId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  role: "customer" | "worker" | null;
  worker: WorkerWithRelations | null;
}

/** Full account context for the signed-in user (profile row + worker profile if any). */
export async function getAccount(): Promise<Account | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: u } = await supabase
    .from("users")
    .select("id, full_name, phone, email, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: w } = await supabase
    .from("workers")
    .select(
      `*,
       profession:professions ( id, slug, name_fr ),
       location:locations ( id, slug, name ),
       photos:worker_photos ( id, url, storage_path, type, is_primary, sort_order )`,
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  return {
    userId: user.id,
    fullName: u?.full_name ?? null,
    phone: u?.phone ?? null,
    email: u?.email ?? user.email ?? null,
    role: (u?.role as Account["role"]) ?? null,
    worker: (w as unknown as WorkerWithRelations) ?? null,
  };
}

/** Lightweight check used to gate the "become a fundi" flow. */
export async function hasWorkerProfile(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("workers")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}
