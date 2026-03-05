"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/types/database";

interface AddReviewFormProps {
  profileUserId: string;
  onCreated?(review: Review): void;
}

export function AddReviewForm({ profileUserId, onCreated }: AddReviewFormProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setLoadingUser(false);
    };
    loadUser();
  }, []);

  if (loadingUser) {
    return null;
  }

  if (!userId) {
    return (
      <div className="mt-4">
        <Link href="/login" className="btn-primary text-sm">
          Zaloguj się, aby dodać opinię
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedComment = comment.trim();
    if (!rating || rating < 1 || rating > 5) {
      setError("Wybierz ocenę w skali 1–5.");
      return;
    }
    if (!trimmedComment) {
      setError("Komentarz nie może być pusty.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("reviews")
      .insert({
        profile_id: profileUserId,
        author_id: userId,
        rating,
        comment: trimmedComment,
      })
      .select(
        "id, profile_id, author_id, rating, comment, created_at, updated_at, author:profiles!reviews_author_id_fkey(display_name)"
      )
      .single();
    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data) {
      const review: Review = {
        id: data.id,
        profile_id: data.profile_id,
        author_id: data.author_id,
        rating: data.rating,
         comment: data.comment,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author_display_name:
          (data.author as { display_name: string }[] | null)?.[0]?.display_name ?? null,
      };
      setComment("");
      setRating(0);
      if (onCreated) {
        onCreated(review);
      }
    }
  };

  const currentRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div>
        <p className="text-sm text-[var(--muted)] mb-1">Twoja ocena</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            const active = value <= currentRating;
            return (
              <button
                key={value}
                type="button"
                className="p-1"
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(value)}
              >
                <Star
                  className={`h-5 w-5 ${
                    active ? "text-yellow-400 fill-yellow-400" : "text-[var(--muted)]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Twoja opinia
        </label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Podziel się wrażeniami…"
          maxLength={2000}
        />
      </div>
      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary text-sm" disabled={submitting}>
        {submitting ? "Dodawanie…" : "Dodaj opinię"}
      </button>
    </form>
  );
}

