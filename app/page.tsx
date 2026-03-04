"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgeGate, { getAgeGatePassed } from "@/components/AgeGate";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (getAgeGatePassed()) {
      router.replace("/home");
    }
  }, [mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted)]">Ładowanie…</div>
      </div>
    );
  }

  return <AgeGate />;
}
