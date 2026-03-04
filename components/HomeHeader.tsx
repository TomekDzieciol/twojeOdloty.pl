"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";

export default function HomeHeader() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (u) {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", u.id)
          .maybeSingle();
        setIsAdmin(!!adminRow);
      } else {
        setIsAdmin(false);
      }
    };
    load();
    setMounted(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) {
    return (
      <header className="border-b border-[#2a2a32] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" prefetch={false} className="text-lg font-semibold text-brand-400">
            TowjeOdloty.pl
          </Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[var(--muted)]">…</span>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#2a2a32] bg-[var(--card)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/home" prefetch={false} className="text-lg font-semibold text-brand-400">
          TowjeOdloty.pl
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
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
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Zaloguj
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Rejestracja
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
