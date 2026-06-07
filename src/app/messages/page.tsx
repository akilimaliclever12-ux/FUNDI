import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/queries/messages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/messages");

  const conversations = await getConversations();

  return (
    <div className="container-page max-w-2xl py-6">
      <h1 className="text-2xl font-bold text-ink">Messages</h1>

      {conversations.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-gray-600">Aucune discussion pour le moment.</p>
          <Link href="/workers" className="btn-primary mt-4">Trouver un fundi</Link>
        </div>
      ) : (
        <ul className="card mt-4 divide-y divide-gray-100">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {c.otherName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-ink">{c.otherName}</p>
                    {c.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-500">
                    {c.lastPreview ?? c.subtitle ?? "Nouvelle discussion"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
