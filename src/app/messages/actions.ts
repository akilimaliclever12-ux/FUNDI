"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, newMessageEmail } from "@/lib/email";

export interface StartResult {
  ok: boolean;
  error?: string;
  conversationId?: string;
}

/** Start (or reuse) a conversation between the current customer and a worker. */
export async function startConversation(workerId: string): Promise<StartResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  // worker must exist and be approved
  const { data: worker } = await supabase
    .from("workers")
    .select("id, user_id, status")
    .eq("id", workerId)
    .maybeSingle();
  if (!worker || worker.status !== "approved") {
    return { ok: false, error: "Fundi indisponible." };
  }
  if (worker.user_id === user.id) {
    return { ok: false, error: "Vous ne pouvez pas vous contacter vous-même." };
  }

  // existing conversation?
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("worker_id", workerId)
    .eq("customer_user_id", user.id)
    .maybeSingle();

  if (existing) return { ok: true, conversationId: existing.id };

  // NOTE: do NOT use .insert().select() here. The conversations SELECT policy
  // calls a SECURITY DEFINER function that re-queries the table, and the
  // just-inserted row isn't visible to that sub-query within the same insert
  // statement (RLS returns 42501). Insert, then select separately.
  const { error: insErr } = await supabase
    .from("conversations")
    .insert({ worker_id: workerId, customer_user_id: user.id });
  if (insErr) return { ok: false, error: "Impossible de démarrer la discussion." };

  const { data: created } = await supabase
    .from("conversations")
    .select("id")
    .eq("worker_id", workerId)
    .eq("customer_user_id", user.id)
    .maybeSingle();
  if (!created) return { ok: false, error: "Discussion créée mais introuvable." };

  // log a lead (analytics continuity)
  await supabase.from("leads").insert({
    worker_id: workerId,
    customer_user_id: user.id,
    channel: "chat",
    source_page: "chat_start",
  });

  return { ok: true, conversationId: created.id };
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/** Send a message in a conversation (RLS ensures the sender is a participant). */
export async function sendMessage(conversationId: string, body: string): Promise<SendResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const text = body.trim();
  if (!text) return { ok: false, error: "Message vide." };
  if (text.length > 2000) return { ok: false, error: "Message trop long." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    body: text,
  });
  if (error) return { ok: false, error: "Envoi échoué." };

  // Email notification to the other participant (best-effort, no-op without Resend).
  void notifyRecipient(conversationId, user.id, text);

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}

/** Reset unread counter for the current user on a conversation. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: c } = await supabase
    .from("conversations")
    .select("customer_user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!c) return;

  const isCustomer = c.customer_user_id === user.id;
  await supabase
    .from("conversations")
    .update(isCustomer ? { customer_unread: 0 } : { worker_unread: 0 })
    .eq("id", conversationId);
  revalidatePath("/messages");
}

async function notifyRecipient(conversationId: string, senderId: string, preview: string) {
  // Use service role: looking up the *other* user's email is blocked by RLS.
  const supabase = createAdminClient();
  const { data: c } = await supabase
    .from("conversations")
    .select(
      `customer_user_id,
       worker:workers ( user_id ),
       customer:users!conversations_customer_user_id_fkey ( full_name )`,
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (!c) return;

  const workerUserId = (c as any).worker?.user_id as string | undefined;
  const recipientId = senderId === (c as any).customer_user_id ? workerUserId : (c as any).customer_user_id;
  if (!recipientId) return;

  const [{ data: recipient }, { data: sender }] = await Promise.all([
    supabase.from("users").select("email").eq("id", recipientId).maybeSingle(),
    supabase.from("users").select("full_name").eq("id", senderId).maybeSingle(),
  ]);
  if (!recipient?.email) return;

  const mail = newMessageEmail(sender?.full_name ?? "Quelqu'un", preview, conversationId);
  await sendEmail({ to: recipient.email, subject: mail.subject, html: mail.html });
}
