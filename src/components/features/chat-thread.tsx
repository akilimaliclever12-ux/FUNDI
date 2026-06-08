"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/app/messages/actions";
import type { MessageRow } from "@/types/database.types";

export function ChatThread({
  conversationId,
  myUserId,
  initialMessages,
}: {
  conversationId: string;
  myUserId: string;
  initialMessages: MessageRow[];
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // mark read on open
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  // realtime: append incoming messages
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as MessageRow;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_user_id !== myUserId) void markConversationRead(conversationId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, myUserId, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");

    // optimistic
    const optimistic: MessageRow = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId,
      sender_user_id: myUserId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await sendMessage(conversationId, body);
    setSending(false);
    if (!res.ok) {
      // rollback optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(body);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-1 py-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Envoyez un message pour démarrer la discussion.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_user_id === myUserId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  mine
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm text-white"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-ink"
                }
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          className="input flex-1"
          aria-label="Message"
        />
        <button type="submit" className="btn-primary shrink-0" disabled={sending || !text.trim()}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
