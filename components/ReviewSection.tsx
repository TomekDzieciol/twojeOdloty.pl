"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/types/database";
import { AddReviewForm } from "@/components/AddReviewForm";

interface ReviewSectionProps {
  profileUserId: string;
}

interface ReviewRow {
  id: string;
  profile_id: string;
  author_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  author: { display_name: string | null } | null;
}

export function ReviewSection({ profileUserId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      setError("");
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("reviews")
        .select(
          "id, profile_id, author_id, rating, comment, created_at, updated_at, author:profiles!reviews_author_id_fkey(display_name)"
        )
        .eq("profile_id", profileUserId)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }

      const mapped =
        (data as (ReviewRow & {
          author: { display_name: string | null }[] | null;
        })[] | null)?.map((row) => ({
          id: row.id,
          profile_id: row.profile_id,
          author_id: row.author_id,
          rating: row.rating,
          comment: row.comment,
          created_at: row.created_at,
          updated_at: row.updated_at,
          author_display_name:
            (row.author as { display_name: string | null }[] | null)?.[0]?.display_name ??
            null,
        })) ?? [];
      setReviews(mapped);
    };
    loadReviews();
  }, [profileUserId]);

  const handleCreated = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1;
        const active = value <= rating;
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

  return (
    <section className="card mt-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold">
          Opinie
          {reviews.length > 0 && (
            <span className="ml-2 text-sm text-[var(--muted)]">
              ({reviews.length})
            </span>
          )}
        </h2>
      </div>

      <AddReviewForm profileUserId={profileUserId} onCreated={handleCreated} />

      <div className="mt-4 space-y-3">
        {loading && (
          <p className="text-sm text-[var(--muted)]">Ładowanie opinii…</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-400" role="alert">
            Nie udało się pobrać opinii: {error}
          </p>
        )}
        {!loading && !error && reviews.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Ten profil nie ma jeszcze żadnych opinii. Bądź pierwszą osobą, która ją doda.
          </p>
        )}
        {!loading &&
          !error &&
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-[#2a2a32] pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {review.author_display_name || "Anonimowy użytkownik"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(review.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className="mt-2 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
}

