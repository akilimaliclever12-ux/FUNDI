"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/auth";
import type { WorkerStatus } from "@/types/database.types";

interface ActionResult {
  ok: boolean;
  error?: string;
}

async function writeAudit(
  adminId: string,
  action: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    actor_admin_id: adminId,
    action,
    entity_type: "workers",
    entity_id: entityId,
    before: before ?? null,
    after: after ?? null,
  });
}

/** Approve / reject / suspend / reset a worker's status. */
export async function setWorkerStatus(
  workerId: string,
  status: WorkerStatus,
  rejectionReason?: string,
): Promise<ActionResult> {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return { ok: false, error: "Non autorisé." };

  const db = createClient(); // RLS allows admins full access via is_admin()
  const { data: before } = await db.from("workers").select("status").eq("id", workerId).single();

  const patch: Record<string, unknown> = {
    status,
    rejection_reason: status === "rejected" ? rejectionReason ?? null : null,
    approved_at: status === "approved" ? new Date().toISOString() : null,
  };

  const { error } = await db.from("workers").update(patch).eq("id", workerId);
  if (error) return { ok: false, error: "Mise à jour échouée." };

  await writeAudit(adminUser.id, `worker.${status}`, workerId, before, { status });

  revalidatePath("/workers");
  revalidatePath(`/workers/${workerId}`);
  revalidatePath("/admin/workers");
  return { ok: true };
}

/** Soft-delete a worker. */
export async function deleteWorker(workerId: string): Promise<ActionResult> {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return { ok: false, error: "Non autorisé." };

  const db = createClient();
  const { error } = await db
    .from("workers")
    .update({ deleted_at: new Date().toISOString(), status: "suspended" })
    .eq("id", workerId);
  if (error) return { ok: false, error: "Suppression échouée." };

  await writeAudit(adminUser.id, "worker.deleted", workerId, null, null);

  revalidatePath("/workers");
  revalidatePath("/admin/workers");
  return { ok: true };
}

/** Edit core worker fields. */
export async function editWorker(
  workerId: string,
  patch: { headline?: string; bio?: string; years_experience?: number },
): Promise<ActionResult> {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return { ok: false, error: "Non autorisé." };

  const db = createClient();
  const { error } = await db.from("workers").update(patch).eq("id", workerId);
  if (error) return { ok: false, error: "Édition échouée." };

  await writeAudit(adminUser.id, "worker.edited", workerId, null, patch);
  revalidatePath(`/workers/${workerId}`);
  revalidatePath("/admin/workers");
  return { ok: true };
}

/** Publish or reject a review. */
export async function moderateReview(
  reviewId: string,
  status: "published" | "rejected",
): Promise<ActionResult> {
  const adminUser = await getCurrentAdmin();
  if (!adminUser) return { ok: false, error: "Non autorisé." };

  const db = createClient();
  const { error } = await db.from("reviews").update({ status }).eq("id", reviewId);
  if (error) return { ok: false, error: "Modération échouée." };

  revalidatePath("/admin/reviews");
  return { ok: true };
}
