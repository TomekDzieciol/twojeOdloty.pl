import Link from "next/link";
import type { Ad } from "@/types/database";

interface AdCardProps {
  ad: Ad;
  profileImageUrl?: string | null;
}

const genderLabels: Record<string, string> = {
  male: "Mężczyzna",
  female: "Kobieta",
  couple: "Para",
};

export default function AdCard({ ad, profileImageUrl }: AdCardProps) {
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="card block transition hover:border-brand-500/50 hover:bg-[#1e1e24]"
    >
      <div className="aspect-[4/3] rounded-lg bg-[#25252d] mb-3 overflow-hidden">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--muted)] text-4xl">
            —
          </div>
        )}
      </div>
      <h3 className="font-semibold line-clamp-2">{ad.title}</h3>
      <div className="mt-1 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        {ad.city && <span>{ad.city}</span>}
        <span>{genderLabels[ad.gender] ?? ad.gender}</span>
      </div>
    </Link>
  );
}
