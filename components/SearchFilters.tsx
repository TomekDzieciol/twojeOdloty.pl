"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const GENDERS = [
  { value: "", label: "Wszystkie" },
  { value: "male", label: "Mężczyźni" },
  { value: "female", label: "Kobiety" },
  { value: "couple", label: "Pary" },
] as const;

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [gender, setGender] = useState(searchParams.get("gender") ?? "");

  const apply = useCallback(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    if (gender) params.set("gender", gender);
    router.push(`/home?${params.toString()}`);
  }, [query, city, gender, router]);

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold">Wyszukaj</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            Treść (tytuł)
          </label>
          <input
            type="text"
            className="input"
            placeholder="Słowa z tytułu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            Miasto
          </label>
          <input
            type="text"
            className="input"
            placeholder="np. Warszawa"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            Płeć
          </label>
          <select
            className="input"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            {GENDERS.map((g) => (
              <option key={g.value || "all"} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={apply} className="btn-primary w-full">
            Szukaj
          </button>
        </div>
      </div>
    </div>
  );
}
