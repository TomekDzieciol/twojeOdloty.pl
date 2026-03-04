"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SendMessageFormProps {
  recipientId: string;
}

export function SendMessageForm({ recipientId }: SendMessageFormProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Musisz być zalogowany, aby wysłać wiadomość.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      body: body.trim(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    setBody("");
  };

  if (sent) {
    return (
      <div className="mt-4 p-3 rounded-lg bg-[#25252d] border border-[#2a2a32]">
        <p className="text-sm text-green-400">Wiadomość została wysłana.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 rounded-lg bg-[#25252d] border border-[#2a2a32]">
      <p className="text-sm text-[var(--muted)] mb-2">Wyślij wiadomość</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="input min-h-[100px] resize-y"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Napisz wiadomość…"
          required
          maxLength={2000}
        />
        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading ? "Wysyłanie…" : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
