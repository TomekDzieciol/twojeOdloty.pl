"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface DashboardProfileProps {
  profile?: Profile | null;
  userId: string;
}

export default function DashboardProfile({ profile, userId }: DashboardProfileProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        city: city.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMessage("Błąd zapisu: " + error.message);
      return;
    }
    setMessage("Zapisano.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Nazwa wyświetlana
        </label>
        <input
          type="text"
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="np. Ania"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Miasto
        </label>
        <input
          type="text"
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="np. Warszawa"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Nr telefonu
        </label>
        <input
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="np. 500 123 456"
        />
      </div>
      {message && (
        <p className={message.startsWith("Błąd") ? "text-red-400 text-sm" : "text-green-400 text-sm"}>
          {message}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Zapisywanie…" : "Zapisz"}
      </button>
    </form>
  );
}
