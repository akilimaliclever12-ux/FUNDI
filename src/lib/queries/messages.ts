import { createClient } from "@/lib/supabase/server";
import type { MessageRow } from "@/types/database.types";

export interface ConversationListItem {
  id: string;
  otherName: string;
  subtitle: string | null;
  lastPreview: string | null;
  lastAt: string | null;
  unread: number;
  isCustomer: boolean;
}

/** Conversations for the current user (customer or worker). RLS-scoped. */
export async function getConversations(): Promise<ConversationListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select(
      `id, customer_user_id, customer_unread, worker_unread, last_message_preview, last_message_at,
       worker:workers ( headline, profession:professions(name_fr) ),
       customer:users!conversations_customer_user_id_fkey ( full_name )`,
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  return (data ?? []).map((c: any) => {
    const isCustomer = c.customer_user_id === user.id;
    return {
      id: c.id,
      isCustomer,
      otherName: isCustomer
        ? c.worker?.headline ?? "Fundi"
        : c.customer?.full_name ?? "Client",
      subtitle: isCustomer ? c.worker?.profession?.name_fr ?? null : "Client",
      lastPreview: c.last_message_preview,
      lastAt: c.last_message_at,
      unread: isCustomer ? c.customer_unread : c.worker_unread,
    };
  });
}

export interface ConversationContext {
  id: string;
  isCustomer: boolean;
  otherName: string;
  myUserId: string;
}

/** Single conversation header context for the current user, or null if no access. */
export async function getConversationContext(
  id: string,
): Promise<ConversationContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: c } = await supabase
    .from("conversations")
    .select(
      `id, customer_user_id,
       worker:workers ( headline ),
       customer:users!conversations_customer_user_id_fkey ( full_name )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!c) return null;
  const isCustomer = (c as any).customer_user_id === user.id;
  return {
    id: (c as any).id,
    isCustomer,
    otherName: isCustomer
      ? (c as any).worker?.headline ?? "Fundi"
      : (c as any).customer?.full_name ?? "Client",
    myUserId: user.id,
  };
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as MessageRow[];
}

/** Total unread across all conversations for the header badge. */
export async function getTotalUnread(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("conversations")
    .select("customer_user_id, customer_unread, worker_unread");
  return (data ?? []).reduce((sum: number, c: any) => {
    const mine = c.customer_user_id === user.id ? c.customer_unread : c.worker_unread;
    return sum + (mine ?? 0);
  }, 0);
}
