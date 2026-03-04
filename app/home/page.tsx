import Link from "next/link";
import { getAds } from "@/lib/ads";
import AdCard from "@/components/AdCard";
import SearchFilters from "@/components/SearchFilters";

interface HomePageProps {
  searchParams: { q?: string; city?: string; gender?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams;
  const ads = await getAds({
    q: params.q,
    city: params.city,
    gender: params.gender,
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2a32] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" className="text-lg font-semibold text-brand-400">
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Ogłoszenia towarzyskie
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Przeglądaj profile i znajdź kogo szukasz. Załóż konto, aby dodawać
            własne ogłoszenia.
          </p>
        </section>

        <section className="mb-8">
          <SearchFilters />
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Ostatnie ogłoszenia</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                profileImageUrl={ad.profile_image_url ?? ad.profile_image_path}
              />
            ))}
          </div>
          {ads.length === 0 && (
            <p className="text-[var(--muted)]">
              Brak ogłoszeń spełniających kryteria. Spróbuj zmienić filtry.
            </p>
          )}
        </section>

        <section className="card text-center">
          <h2 className="text-lg font-semibold">Dołącz do portalu</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Załóż konto, dodawaj zdjęcia i ogłoszenia, odpowiadaj na wiadomości.
          </p>
          <Link href="/register" className="btn-primary mt-4 inline-block">
            Zarejestruj się
          </Link>
        </section>
      </main>
    </div>
  );
}
