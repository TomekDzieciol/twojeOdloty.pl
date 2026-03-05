"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReviewRow {
  id: string;
  profile_id: string;
  author_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  profile: { display_name: string | null } | null;
  author: { display_name: string | null } | null;
}

export default function DashboardAdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("reviews")
      .select(
        "id, profile_id, author_id, rating, comment, created_at, updated_at, profile:profiles!reviews_profile_id_fkey(display_name), author:profiles!reviews_author_id_fkey(display_name)"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }

    const mapped: ReviewRow[] =
      (data as (ReviewRow & {
        profile: { display_name: string | null }[] | null;
        author: { display_name: string | null }[] | null;
      })[] | null)?.map((row) => ({
        id: row.id,
        profile_id: row.profile_id,
        author_id: row.author_id,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profile: (row.profile as { display_name: string | null }[] | null)?.[0] ?? null,
        author: (row.author as { display_name: string | null }[] | null)?.[0] ?? null,
      })) ?? [];

    setReviews(mapped);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (review: ReviewRow) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditHoverRating(0);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditHoverRating(0);
    setEditComment("");
  };

  const handleSave = async (id: string) => {
    const trimmed = editComment.trim();
    if (!editRating || editRating < 1 || editRating > 5) {
      setError("Ocena musi być w skali 1–5.");
      return;
    }
    if (!trimmed) {
      setError("Komentarz nie może być pusty.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("reviews")
      .update({ rating: editRating, comment: trimmed })
      .eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, rating: editRating, comment: trimmed } : r
      )
    );
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Na pewno usunąć tę opinię?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("reviews").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const renderStars = (rating: number, interactive = false) => {
    const current = interactive ? editHoverRating || editRating : rating;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const active = value <= current;
          if (interactive) {
            return (
              <button
                key={value}
                type="button"
                className="p-0.5"
                onMouseEnter={() => setEditHoverRating(value)}
                onMouseLeave={() => setEditHoverRating(0)}
                onClick={() => setEditRating(value)}
              >
                <Star
                  className={`h-4 w-4 ${
                    active ? "text-yellow-400 fill-yellow-400" : "text-[var(--muted)]"
                  }`}
                />
              </button>
            );
          }
          return (
            <Star
              key={value}
              className={`h-4 w-4 ${
                active ? "text-yellow-400 fill-yellow-400" : "text-[var(--muted)]"
              }`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <p className="text-[var(--muted)] text-sm">Ładowanie opinii…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Ostatnie opinie wystawione na profilach. Jako administrator możesz je edytować
        lub usuwać (zgodnie z polityką serwisu).
      </p>
      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {reviews.map((r) => {
          const isEditing = editingId === r.id;
          return (
            <div
              key={r.id}
              className="border border-[#2a2a32] rounded-lg p-3 bg-[#15151b]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-sm">
                    <span className="text-[var(--muted)] text-xs uppercase tracking-wide">
                      Profil:
                    </span>{" "}
                    <span className="font-medium">
                      {r.profile?.display_name || r.profile_id.slice(0, 8) + "…"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-[var(--muted)] text-xs uppercase tracking-wide">
                      Autor:
                    </span>{" "}
                    <span className="font-medium">
                      {r.author?.display_name || r.author_id.slice(0, 8) + "…"}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(r.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
                <div>{isEditing ? renderStars(r.rating, true) : renderStars(r.rating)}</div>
              </div>

              <div className="mt-2">
                {isEditing ? (
                  <textarea
                    className="input min-h-[80px] resize-y text-sm"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {r.comment}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 justify-end">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() => handleSave(r.id)}
                      disabled={saving}
                    >
                      {saving ? "Zapisywanie…" : "Zapisz zmiany"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                      onClick={() => startEdit(r)}
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(r.id)}
                    >
                      Usuń
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {reviews.length === 0 && (
          <p className="text-[var(--muted)] text-sm">Brak opinii do moderacji.</p>
        )}
      </div>
    </div>
  );
}

