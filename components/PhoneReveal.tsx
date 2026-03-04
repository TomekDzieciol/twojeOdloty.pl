"use client";

import { useState } from "react";

interface PhoneRevealProps {
  userId: string;
  hasPhone: boolean;
}

export function PhoneReveal({ userId, hasPhone }: PhoneRevealProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleReveal = async () => {
    if (phone !== null) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(userId)}/phone`);
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        return;
      }
      setPhone(data.phone ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPhone) return null;

  return (
    <div className="mt-4 p-3 rounded-lg bg-[#25252d] border border-[#2a2a32]">
      <p className="text-sm text-[var(--muted)] mb-2">Numer telefonu</p>
      {phone === null ? (
        <>
          <button
            type="button"
            onClick={handleReveal}
            disabled={loading}
            className="text-sm font-medium text-brand-400 hover:text-brand-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded px-2 py-1"
          >
            {loading ? "Ładowanie…" : "Pokaż numer telefonu"}
          </button>
          {error && (
            <p className="text-sm text-red-400 mt-1">Nie udało się załadować numeru.</p>
          )}
        </>
      ) : (
        <p className="text-lg font-medium tabular-nums" dir="ltr">
          {phone}
        </p>
      )}
    </div>
  );
}
