import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardAdminUsers from "@/components/DashboardAdminUsers";
import DashboardAdminBans from "@/components/DashboardAdminBans";

export default async function DashboardAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();
  if (!adminRow) redirect("/dashboard");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Panel administratora</h1>
        <p className="text-[var(--muted)]">
          Zarządzanie użytkownikami i banami.
        </p>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Zbanowane e-maile</h2>
        <DashboardAdminBans />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Użytkownicy</h2>
        <DashboardAdminUsers />
      </section>
    </div>
  );
}
