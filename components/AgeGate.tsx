"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AGE_GATE_KEY = "ageGatePassed";

export function setAgeGatePassed() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(AGE_GATE_KEY, "1");
  }
}

export function getAgeGatePassed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AGE_GATE_KEY) === "1";
}

export default function AgeGate() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setError("Potwierdź, że masz ukończone 18 lat.");
      return;
    }
    setAgeGatePassed();
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="card max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-brand-400 mb-2">
          TowjeOdloty.pl
        </h1>
        <p className="text-[var(--muted)] text-sm mb-6">
          Portal ogłoszeniowy dla osób pełnoletnich
        </p>

        <div className="text-left text-sm text-[var(--foreground)]/90 mb-8 space-y-3">
          <p>
            Ta strona zawiera treści przeznaczone wyłącznie dla osób, które
            ukończyły 18. rok życia. Wchodząc, potwierdzasz, że spełniasz ten
            warunek i akceptujesz regulamin serwisu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setError("");
              }}
              className="rounded border-[#2a2a32] bg-[var(--card)] text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm">Mam ukończone 18 lat</span>
          </label>
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full py-3">
            Wejdź na stronę
          </button>
        </form>
      </div>
    </div>
  );
}
