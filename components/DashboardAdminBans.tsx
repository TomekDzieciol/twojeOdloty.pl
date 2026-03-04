"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface BannedEmail {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
}

export default function DashboardAdminBans() {
  const [list, setList] = useState<BannedEmail[]>([]);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("banned_emails")
      .select("id, email, reason, created_at")
      .order("created_at", { ascending: false });
    setList(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("banned_emails").insert({
      email: trimmed,
      reason: reason.trim() || null,
      banned_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail("");
    setReason("");
    load();
  };

  const handleUnban = async (id: string) => {
    const supabase = createClient();
    await supabase.from("banned_emails").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleBan} className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            Adres e-mail do zbanowania
          </label>
          <input
            type="email"
            className="input w-64"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            Powód (opcjonalnie)
          </label>
          <input
            type="text"
            className="input w-48"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "…" : "Zbanuj"}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <ul className="space-y-2">
        {list.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between py-2 border-b border-[#2a2a32] last:border-0"
          >
            <div>
              <span className="font-medium">{b.email}</span>
              {b.reason && (
                <span className="text-sm text-[var(--muted)] ml-2">
                  {b.reason}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleUnban(b.id)}
              className="text-sm text-brand-400 hover:underline"
            >
              Odbanuj
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="text-[var(--muted)] text-sm">Brak zbanowanych adresów.</p>
      )}
    </div>
  );
}
