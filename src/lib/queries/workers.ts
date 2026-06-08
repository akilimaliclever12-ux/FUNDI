import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE } from "@/lib/constants";
import type { SearchParams, WorkerWithRelations } from "@/types";
import type { CredentialRow } from "@/types/database.types";

const WORKER_SELECT = `
  *,
  profession:professions ( id, slug, name_fr, name_sw, icon ),
  location:locations ( id, slug, name, type ),
  photos:worker_photos ( id, url, storage_path, type, is_primary, sort_order, width, height )
`;

export interface WorkerListResult {
  workers: WorkerWithRelations[];
  total: number;
  page: number;
  pageCount: number;
}

/** Public, filtered, paginated listing of APPROVED workers (RLS enforces approved-only). */
export async function searchWorkers(params: SearchParams): Promise<WorkerListResult> {
  const supabase = createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Resolve slugs -> ids first (reliable filtering on the workers table itself).
  let professionId: string | null = null;
  let locationIds: string[] | null = null;
  if (params.profession) {
    const { data } = await supabase
      .from("professions")
      .select("id")
      .eq("slug", params.profession)
      .maybeSingle();
    professionId = data?.id ?? null;
    if (!professionId) return { workers: [], total: 0, page, pageCount: 0 };
  }
  if (params.quartier) {
    // most specific: a single quartier
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", params.quartier)
      .maybeSingle();
    if (!data) return { workers: [], total: 0, page, pageCount: 0 };
    locationIds = [data.id as string];
  } else if (params.commune) {
    // a commune: include the commune itself + all its quartiers
    const { data: commune } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", params.commune)
      .maybeSingle();
    if (!commune) return { workers: [], total: 0, page, pageCount: 0 };
    const { data: kids } = await supabase
      .from("locations")
      .select("id")
      .eq("parent_id", commune.id);
    locationIds = [commune.id as string, ...(kids ?? []).map((k) => k.id as string)];
  }

  let query = supabase
    .from("workers")
    .select(WORKER_SELECT, { count: "exact" })
    .eq("status", "approved")
    .is("deleted_at", null);

  if (professionId) query = query.eq("profession_id", professionId);
  if (locationIds) query = query.in("location_id", locationIds);
  if (params.q && params.q.trim()) {
    // full-text search on the maintained tsvector, fallback to ilike on headline
    const term = params.q.trim();
    query = query.textSearch("search_tsv", term, { type: "websearch", config: "simple" });
  }

  query = query
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, count, error } = await query;
  if (error) {
    // On filter-join edge cases, fail soft with empty list rather than crash the page.
    return { workers: [], total: 0, page, pageCount: 0 };
  }

  const total = count ?? 0;
  return {
    workers: (data ?? []) as unknown as WorkerWithRelations[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Single approved worker by id, with photos + published reviews. */
export async function getWorkerById(id: string): Promise<WorkerWithRelations | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workers")
    .select(
      `${WORKER_SELECT}, reviews:reviews ( id, author_name, rating, comment, status, created_at )`,
    )
    .eq("id", id)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return data as unknown as WorkerWithRelations;
}

/** Public credentials of an approved worker (certifications, diplomas, attestations). */
export async function getWorkerCredentials(workerId: string): Promise<CredentialRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("worker_credentials")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at");
  return (data as CredentialRow[]) ?? [];
}

/**
 * Public reference persons: NAME + POSITION only (the contact is private).
 * Uses the service role because the references table is owner/admin-only by RLS;
 * we deliberately never select the `contact` column here.
 */
export async function getPublicReferences(
  workerId: string,
): Promise<{ id: string; name: string; position: string | null }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("worker_references")
    .select("id, name, position")
    .eq("worker_id", workerId)
    .order("created_at");
  return data ?? [];
}

/** Ids of all approved workers (for sitemap / static params). */
export async function getApprovedWorkerIds(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workers")
    .select("id")
    .eq("status", "approved")
    .is("deleted_at", null);
  return (data ?? []).map((w) => w.id as string);
}
