import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getConversationContext, getMessages } from "@/lib/queries/messages";
import { ChatThread } from "@/components/features/chat-thread";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discussion" };

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?next=/messages/${params.id}`);

  const ctx = await getConversationContext(params.id);
  if (!ctx) notFound();

  const messages = await getMessages(params.id);

  return (
    <div className="container-page max-w-2xl py-4">
      <div className="mb-2 flex items-center gap-2">
        <Link href="/messages" className="text-sm text-brand hover:underline">← Messages</Link>
      </div>
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
          {ctx.otherName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="font-semibold text-ink">{ctx.otherName}</p>
          <p className="text-xs text-gray-400">{ctx.isCustomer ? "Fundi" : "Client"}</p>
        </div>
      </div>

      <ChatThread
        conversationId={params.id}
        myUserId={ctx.myUserId}
        initialMessages={messages}
      />
    </div>
  );
}
