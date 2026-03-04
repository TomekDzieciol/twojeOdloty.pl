"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<"ok" | "err" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMessage(null);
    setLoading(true);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/dashboard`;
    const { data: signUpData, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (signUpData?.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(
        "Konto utworzone. Sprawdź skrzynkę e-mail i kliknij link, aby potwierdzić adres. Potem możesz się zalogować."
      );
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResendMessage(null);
    setResendLoading(true);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResendLoading(false);
    setResendMessage(resendErr ? "err" : "ok");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-6">Rejestracja</h1>
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
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          {success && (
            <div className="space-y-2">
              <p className="text-green-400 text-sm" role="status">
                {success}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Nie dostałeś e-maila?{" "}
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-brand-400 hover:underline disabled:opacity-50"
                >
                  {resendLoading ? "Wysyłanie…" : "Wyślij ponownie link potwierdzający"}
                </button>
              </p>
              {resendMessage === "ok" && (
                <p className="text-green-400 text-sm">E-mail wysłany ponownie. Sprawdź skrzynkę.</p>
              )}
              {resendMessage === "err" && (
                <p className="text-red-400 text-sm">Nie udało się wysłać. Spróbuj później lub sprawdź, czy adres jest poprawny.</p>
              )}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Rejestracja…" : "Zarejestruj się"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Masz już konto?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Zaloguj się
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
