import Link from "next/link";
import type { ProfileForListing } from "@/lib/ads";

interface ProfileCardProps {
  profile: ProfileForListing;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link
      href={`/profile/${profile.id}`}
      className="card block transition hover:border-brand-500/50 hover:bg-[#1e1e24]"
    >
      <div className="aspect-[4/3] rounded-lg bg-[#25252d] mb-3 overflow-hidden">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--muted)] text-4xl">
            —
          </div>
        )}
      </div>
      <h3 className="font-semibold line-clamp-2">
        {profile.display_name || "Profil"}
      </h3>
      {profile.city && (
        <p className="mt-1 text-sm text-[var(--muted)]">{profile.city}</p>
      )}
    </Link>
  );
}
