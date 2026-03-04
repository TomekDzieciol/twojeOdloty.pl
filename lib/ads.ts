import { createClient } from "@/lib/supabase/server";
import type { Ad } from "@/types/database";

export interface ProfileForListing {
  id: string;
  display_name: string | null;
  city: string | null;
  profile_image_url: string | null;
}

export interface ProfileInAd {
  display_name: string | null;
  city: string | null;
  created_at?: string | null;
}

export interface AdWithProfile extends Ad {
  profiles: ProfileInAd | null;
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
    .select("id, user_id, title, body, gender, city, is_active, created_at, updated_at")
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

  const adsList = ads ?? [];
  const userIds = Array.from(new Set(adsList.map((a: { user_id: string }) => a.user_id)));
  const [profilesRes, imagesRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, city").in("id", userIds),
    supabase.from("images").select("user_id, path").eq("is_profile", true).in("user_id", userIds),
  ]);

  const profileByUserId: Record<string, { display_name: string | null; city: string | null }> = {};
  for (const p of profilesRes.data ?? []) {
    profileByUserId[p.id] = { display_name: p.display_name ?? null, city: p.city ?? null };
  }
  const pathByUser: Record<string, string> = {};
  for (const img of imagesRes.data ?? []) {
    pathByUser[img.user_id] = img.path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return adsList.map((a: Record<string, unknown>) => {
    const path = pathByUser[a.user_id as string];
    const profile_image_url =
      path && baseUrl ? `${baseUrl}/storage/v1/object/public/images/${path}` : null;
    return {
      ...a,
      profiles: profileByUserId[a.user_id as string] ?? null,
      profile_image_path: path ?? null,
      profile_image_url,
    };
  }) as AdWithProfile[];
}

export async function getNewestProfiles(filters: {
  city?: string;
}): Promise<ProfileForListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  let supabase;
  try {
    supabase = createClient();
  } catch {
    return [];
  }

  const { data: profileImages, error: imagesError } = await supabase
    .from("images")
    .select("user_id, path, created_at")
    .eq("is_profile", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (imagesError || !profileImages?.length) return [];

  const userIds = Array.from(new Set(profileImages.map((row) => row.user_id)));
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, city")
    .in("id", userIds);

  if (profilesError) return [];

  const profileById: Record<string, { display_name: string | null; city: string | null }> = {};
  for (const p of profilesData ?? []) {
    profileById[p.id] = { display_name: p.display_name ?? null, city: p.city ?? null };
  }

  const pathByUser: Record<string, string> = {};
  for (const row of profileImages) {
    if (!pathByUser[row.user_id]) pathByUser[row.user_id] = row.path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const cityFilter = filters.city?.trim()?.toLowerCase();

  const result: ProfileForListing[] = [];
  for (const row of profileImages) {
    if (result.length >= 24) break;
    const profile = profileById[row.user_id];
    if (!profile) continue;
    if (cityFilter && !profile.city?.toLowerCase().includes(cityFilter)) continue;
    if (result.some((r) => r.id === row.user_id)) continue;
    const profile_image_url =
      pathByUser[row.user_id] && baseUrl
        ? `${baseUrl}/storage/v1/object/public/images/${pathByUser[row.user_id]}`
        : null;
    result.push({
      id: row.user_id,
      display_name: profile.display_name,
      city: profile.city,
      profile_image_url,
    });
  }
  return result;
}
