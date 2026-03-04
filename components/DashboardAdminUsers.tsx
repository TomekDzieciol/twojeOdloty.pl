"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileRow {
  id: string;
  display_name: string | null;
  city: string | null;
  created_at: string;
}

export default function DashboardAdminUsers() {
  const [list, setList] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, display_name, city, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setList(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-[var(--muted)]">Ładowanie…</p>;

  return (
    <div className="overflow-x-auto">
      <p className="text-sm text-[var(--muted)] mb-4">
        Lista profili (ostatnie 100). Usuwanie użytkowników wykonuj przez
        Supabase Dashboard → Authentication → Users lub Admin API.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2a32] text-left">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Nazwa</th>
            <th className="py-2 pr-4">Miasto</th>
            <th className="py-2">Utworzono</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b border-[#2a2a32]">
              <td className="py-2 pr-4 font-mono text-xs">{p.id.slice(0, 8)}…</td>
              <td className="py-2 pr-4">{p.display_name ?? "—"}</td>
              <td className="py-2 pr-4">{p.city ?? "—"}</td>
              <td className="py-2 text-[var(--muted)]">
                {new Date(p.created_at).toLocaleDateString("pl")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && (
        <p className="text-[var(--muted)] py-4">Brak użytkowników.</p>
      )}
    </div>
  );
}
