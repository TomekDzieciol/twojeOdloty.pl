import { createClient } from "@/lib/supabase/server";
import type { Ad } from "@/types/database";

export interface AdWithProfile extends Ad {
  profiles: { display_name: string | null; city: string | null } | null;
  profile_image_path: string | null;
  profile_image_url?: string | null;
}

const MOCK_ADS: AdWithProfile[] = [
  {
    id: "1",
    user_id: "u1",
    title: "Przykładowe ogłoszenie – Warszawa",
    body: "Opis…",
    gender: "female",
    city: "Warszawa",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { display_name: "Ania", city: "Warszawa" },
    profile_image_path: null,
  },
  {
    id: "2",
    user_id: "u2",
    title: "Szukam towarzystwa – Kraków",
    body: "Opis…",
    gender: "male",
    city: "Kraków",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { display_name: "Marek", city: "Kraków" },
    profile_image_path: null,
  },
  {
    id: "3",
    user_id: "u3",
    title: "Para z Wrocławia",
    body: "Opis…",
    gender: "couple",
    city: "Wrocław",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { display_name: "Para", city: "Wrocław" },
    profile_image_path: null,
  },
];

export async function getAds(filters: {
  q?: string;
  city?: string;
  gender?: string;
}): Promise<AdWithProfile[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return MOCK_ADS;
  }

  let supabase;
  try {
    supabase = createClient();
  } catch {
    return MOCK_ADS;
  }

  let query = supabase
    .from("ads")
    .select(
      `
      id, user_id, title, body, gender, city, is_active, created_at, updated_at,
      profiles(display_name, city)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }
  if (filters.city?.trim()) {
    query = query.ilike("city", `%${filters.city.trim()}%`);
  }
  if (filters.q?.trim()) {
    query = query.or(`title.ilike.%${filters.q.trim()}%,body.ilike.%${filters.q.trim()}%`);
  }

  const { data: ads, error } = await query;
  if (error) return MOCK_ADS;

  const userIds = Array.from(new Set((ads ?? []).map((a: { user_id: string }) => a.user_id)));
  const { data: images } = await supabase
    .from("images")
    .select("user_id, path")
    .eq("is_profile", true)
    .in("user_id", userIds);

  const pathByUser: Record<string, string> = {};
  for (const img of images ?? []) {
    pathByUser[img.user_id] = img.path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (ads ?? []).map((a: Record<string, unknown>) => {
    const path = pathByUser[a.user_id as string];
    const profile_image_url =
      path && baseUrl ? `${baseUrl}/storage/v1/object/public/images/${path}` : null;
    return {
      ...a,
      profile_image_path: path ?? null,
      profile_image_url,
    };
  }) as AdWithProfile[];
}
