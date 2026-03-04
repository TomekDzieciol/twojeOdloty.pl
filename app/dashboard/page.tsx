import { createClient } from "@/lib/supabase/server";
import DashboardProfile from "@/components/DashboardProfile";
import DashboardPhotos from "@/components/DashboardPhotos";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile: unknown = null;
  let images: unknown[] = [];
  try {
    const [profileRes, imagesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("images")
        .select("*")
        .eq("user_id", user.id)
        .order("is_profile", { ascending: false })
        .order("sort_order", { ascending: true }),
    ]);
    profile = profileRes.data;
    images = imagesRes.data ?? [];
  } catch {
    // tabele mogą nie istnieć przed migracjami
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <p className="text-[var(--muted)]">
          Zarządzaj danymi i zdjęciami. Zdjęcie profilowe pokaże Cię w sekcji „Nowe profile” na stronie głównej.
        </p>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Dane profilu</h2>
        <DashboardProfile
          profile={profile as import("@/types/database").Profile | undefined}
          userId={user.id}
        />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Zdjęcia</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Jedno zdjęcie profilowe i do 6 zdjęć w galerii.
        </p>
        <DashboardPhotos
          userId={user.id}
          images={images as import("@/types/database").ImageRecord[]}
          baseUrl={baseUrl}
        />
      </section>
    </div>
  );
}
