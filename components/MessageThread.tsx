"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  otherUserId: string;
  otherDisplayName: string | null;
}

export function MessageThread({
  messages: initialMessages,
  currentUserId,
  otherUserId,
  otherDisplayName,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    const supabase = createClient();
    const toMark = initialMessages.filter(
      (m) => m.recipient_id === currentUserId && m.read_at == null
    );
    if (toMark.length === 0) return;
    const now = new Date().toISOString();
    supabase
      .from("messages")
      .update({ read_at: now })
      .in(
        "id",
        toMark.map((m) => m.id)
      )
      .then(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.recipient_id === currentUserId && !m.read_at ? { ...m, read_at: now } : m
          )
        );
      });
  }, [initialMessages, currentUserId]);

  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError("");
    setReplyLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        recipient_id: otherUserId,
        body: replyBody.trim(),
      })
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .single();
    setReplyLoading(false);
    if (error) {
      setReplyError(error.message);
      return;
    }
    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      setReplyBody("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  isMe
                    ? "bg-brand-500/20 text-[var(--foreground)]"
                    : "bg-[#25252d] border border-[#2a2a32]"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {new Date(msg.created_at).toLocaleString("pl-PL")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleReply} className="flex flex-col gap-2">
        <textarea
          className="input min-h-[80px] resize-y"
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder={`Odpowiedz ${otherDisplayName ?? "użytkownikowi"}…`}
          required
          maxLength={2000}
        />
        {replyError && (
          <p className="text-red-400 text-sm" role="alert">
            {replyError}
          </p>
        )}
        <button type="submit" className="btn-primary text-sm w-fit" disabled={replyLoading}>
          {replyLoading ? "Wysyłanie…" : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
