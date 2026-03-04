import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { id: string } | null = null;
  let isAdmin = false;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();
      isAdmin = !!adminRow;
    }
  } catch {
    // Supabase nie skonfigurowany lub błąd
  }
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2a32] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" prefetch={false} className="text-lg font-semibold text-brand-400">
            TowjeOdloty.pl
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--foreground)] hover:text-brand-400"
            >
              Mój profil
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="text-sm text-[var(--muted)] hover:text-brand-400"
              >
                Panel admina
              </Link>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
