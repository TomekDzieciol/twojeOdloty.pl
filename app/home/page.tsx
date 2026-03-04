import Link from "next/link";
import { getNewestProfiles } from "@/lib/ads";
import ProfileCard from "@/components/ProfileCard";
import SearchFilters from "@/components/SearchFilters";
import HomeHeader from "@/components/HomeHeader";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: { q?: string; city?: string; gender?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams;
  const profiles = await getNewestProfiles({
    q: params.q,
    city: params.city,
  });

  return (
    <div className="min-h-screen">
      <HomeHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Ogłoszenia towarzyskie
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Przeglądaj profile i znajdź kogo szukasz. Załóż konto i dodaj zdjęcie
            profilowe, aby pojawić się w Wynikach wyszukiwania.
          </p>
        </section>

        <section className="mb-8">
          <SearchFilters />
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Wyniki wyszukiwania</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
          {profiles.length === 0 && (
            <p className="text-[var(--muted)]">
              Brak profili spełniających kryteria. Dodaj zdjęcie profilowe w swoim koncie, aby pojawić się tutaj.
            </p>
          )}
        </section>

        <section className="card text-center">
          <h2 className="text-lg font-semibold">Dołącz do portalu</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Załóż konto, dodaj zdjęcie profilowe i odpowiadaj na wiadomości.
          </p>
          <Link href="/register" className="btn-primary mt-4 inline-block">
            Zarejestruj się
          </Link>
        </section>
      </main>
    </div>
  );
}
