import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PhoneReveal } from "@/components/PhoneReveal";
import { ProfileMessageAction } from "@/components/ProfileMessageAction";

interface ProfilePageProps {
  params: { userId: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = params;
  const supabase = createClient();

  const [profileRes, imagesRes, authRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, city, gender, bio, phone").eq("id", userId).single(),
    supabase
      .from("images")
      .select("path, is_profile, sort_order")
      .eq("user_id", userId)
      .order("is_profile", { ascending: false })
      .order("sort_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (profileRes.error || !profileRes.data) notFound();

  const profile = profileRes.data;
  const images = imagesRes.data ?? [];
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const profileImage = images.find((i) => i.is_profile) ?? images[0];
  const profileImageUrl =
    profileImage?.path && baseUrl
      ? `${baseUrl}/storage/v1/object/public/images/${profileImage.path}`
      : null;
  const galleryImages = images.filter((i) => !i.is_profile);
  const imageUrl = (path: string) =>
    baseUrl ? `${baseUrl}/storage/v1/object/public/images/${path}` : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2a32] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" prefetch={false} className="text-lg font-semibold text-brand-400">
            TowjeOdloty.pl
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Zaloguj
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Rejestracja
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/home" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 inline-block">
          ← Powrót do listy
        </Link>

        <div className="card">
          <div className="aspect-[4/3] max-w-md mx-auto rounded-lg bg-[#25252d] overflow-hidden mb-6">
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
          <h1 className="text-2xl font-bold">
            {profile.display_name || "Profil"}
          </h1>
          {(profile.city || profile.gender) && (
            <p className="mt-1 text-[var(--muted)]">
              {[profile.city, profile.gender === "female" ? "Kobieta" : profile.gender === "male" ? "Mężczyzna" : profile.gender === "couple" ? "Para" : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {profile.bio && (
            <p className="mt-3 text-[var(--muted)] whitespace-pre-wrap">{profile.bio}</p>
          )}
          <PhoneReveal userId={userId} hasPhone={!!(profile as { phone?: string }).phone?.trim()} />
          <ProfileMessageAction profileUserId={userId} currentUserId={authRes.data.user?.id ?? null} />
          {galleryImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Galeria</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((img) => (
                  <div
                    key={img.path}
                    className="aspect-[4/3] rounded-lg bg-[#25252d] overflow-hidden"
                  >
                    <img
                      src={imageUrl(img.path)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
