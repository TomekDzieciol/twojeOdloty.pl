"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeRedirect(path: string | null): string {
  if (!path || typeof path !== "string") return "/dashboard";
  if (!path.startsWith("/")) return "/dashboard";
  return path;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      const message =
        err.message === "Invalid login credentials"
          ? "Adres e-mail nie jest w bazie lub hasło jest błędne. Sprawdź dane i spróbuj ponownie."
          : err.message;
      setError(message);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-6">Logowanie</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">
              E-mail
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">
              Hasło
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Nie masz konta?{" "}
          <Link
            href={redirect !== "/dashboard" ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
            className="text-brand-400 hover:underline"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
      <Link
        href="/home"
        className="mt-6 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Strona główna
      </Link>
    </div>
  );
}
