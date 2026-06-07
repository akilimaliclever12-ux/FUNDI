import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startConversation } from "@/app/messages/actions";

export const dynamic = "force-dynamic";

// /messages/start?worker=<id> — auth-gate, then open/create the conversation.
export default async function StartConversationPage({
  searchParams,
}: {
  searchParams: { worker?: string };
}) {
  const workerId = searchParams.worker;
  if (!workerId) redirect("/workers");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(`/messages/start?worker=${workerId}`)}`);
  }

  const res = await startConversation(workerId);
  if (!res.ok || !res.conversationId) {
    redirect(`/workers/${workerId}`);
  }
  redirect(`/messages/${res.conversationId}`);
}
