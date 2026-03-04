import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  if (!userId) {
    return NextResponse.json({ error: "Brak userId" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nie znaleziono profilu" }, { status: 404 });
  }

  if (!data.phone?.trim()) {
    return NextResponse.json({ phone: null }, { status: 200 });
  }

  return NextResponse.json({ phone: data.phone.trim() });
}
