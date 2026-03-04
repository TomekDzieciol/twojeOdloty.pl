import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface AdDetailPageProps {
  params: { id: string };
}

const MOCK_AD = {
  id: "1",
  title: "Przykładowe ogłoszenie – Warszawa",
  body: "To jest przykładowa treść ogłoszenia. Po podłączeniu Supabase będą tu dane z bazy.",
  gender: "female",
  city: "Warszawa",
  created_at: new Date().toISOString(),
  user_id: "u1",
  profiles: { display_name: "Ania", city: "Warszawa" },
};

export default async function AdDetailPage({ params }: AdDetailPageProps) {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let ad: typeof MOCK_AD | null = null;
  let profileImagePath: string | null = null;

  if (hasSupabase) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ads")
        .select(
          "id, title, body, gender, city, created_at, user_id, profiles(display_name, city)"
        )
        .eq("id", params.id)
        .eq("is_active", true)
        .single();
      if (!error && data) {
        const raw = data as {
          id: string;
          title: string;
          body: string;
          gender: string;
          city: string;
          created_at: string;
          user_id: string;
          profiles: { display_name: string; city: string }[] | { display_name: string; city: string } | null;
        };
        const profile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
        ad = {
          ...raw,
          profiles: profile ?? { display_name: "", city: "" },
        } as typeof MOCK_AD;
      }
      if (ad) {
        const { data: img } = await supabase
          .from("images")
          .select("path")
          .eq("user_id", ad.user_id)
          .eq("is_profile", true)
          .single();
        profileImagePath = img?.path ?? null;
      }
    } catch {
      // fallback below
    }
  }

  if (!ad) {
    if (params.id === "1" || !hasSupabase) ad = { ...MOCK_AD, id: params.id };
    else notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const imageUrl =
    profileImagePath && baseUrl
      ? `${baseUrl}/storage/v1/object/public/images/${profileImagePath}`
      : null;

  const genderLabels: Record<string, string> = {
    male: "Mężczyzna",
    female: "Kobieta",
    couple: "Para",
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2a32] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" className="text-lg font-semibold text-brand-400">
            TowjeOdloty.pl
          </Link>
          <nav className="flex gap-4">
            <Link href="/home" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              Ogłoszenia
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              Zaloguj
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/home"
          className="mb-6 inline-block text-sm text-brand-400 hover:underline"
        >
          ← Powrót do listy
        </Link>

        <article className="card">
          {imageUrl && (
            <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-[#25252d]">
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
            {(ad.profiles as { city?: string } | null)?.city && (
              <span>{(ad.profiles as { city: string }).city}</span>
            )}
            <span>{genderLabels[ad.gender] ?? ad.gender}</span>
          </div>
          {ad.body && (
            <div className="mt-6 whitespace-pre-wrap text-[var(--foreground)]/90">
              {ad.body}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
