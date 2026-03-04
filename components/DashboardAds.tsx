"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Ad } from "@/types/database";
import type { AdGender } from "@/types/database";

interface DashboardAdsProps {
  userId: string;
  ads: Ad[];
}

const GENDERS: { value: AdGender; label: string }[] = [
  { value: "male", label: "Mężczyzna" },
  { value: "female", label: "Kobieta" },
  { value: "couple", label: "Para" },
];

export default function DashboardAds({ userId, ads }: DashboardAdsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [gender, setGender] = useState<AdGender>("female");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("ads").insert({
      user_id: userId,
      title: title.trim(),
      body: body.trim() || null,
      gender,
      city: city.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTitle("");
    setBody("");
    setCity("");
    setShowForm(false);
    window.location.reload();
  };

  const toggleActive = async (ad: Ad) => {
    const supabase = createClient();
    await supabase
      .from("ads")
      .update({ is_active: !ad.is_active })
      .eq("id", ad.id);
    window.location.reload();
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Usunąć to ogłoszenie?")) return;
    const supabase = createClient();
    await supabase.from("ads").delete().eq("id", id);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-secondary"
        >
          + Dodaj ogłoszenie
        </button>
      ) : (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h3 className="font-semibold">Nowe ogłoszenie</h3>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Tytuł</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Treść</label>
            <textarea
              className="input min-h-[100px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Płeć</label>
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value as AdGender)}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Miasto</label>
            <input
              type="text"
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Zapisywanie…" : "Opublikuj"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {ads.map((ad) => (
          <li key={ad.id} className="card flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href={`/ad/${ad.id}`} className="font-medium hover:text-brand-400">
                {ad.title}
              </Link>
              <p className="text-sm text-[var(--muted)]">
                {ad.city && `${ad.city} · `}
                {ad.is_active ? "Aktywne" : "Nieaktywne"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleActive(ad)}
                className="btn-secondary text-sm"
              >
                {ad.is_active ? "Ukryj" : "Aktywuj"}
              </button>
              <button
                type="button"
                onClick={() => deleteAd(ad.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>
      {ads.length === 0 && !showForm && (
        <p className="text-[var(--muted)]">Brak ogłoszeń. Dodaj pierwsze.</p>
      )}
    </div>
  );
}
