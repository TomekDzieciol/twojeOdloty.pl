import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://www.twojeodloty.pl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/home`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = await getDynamicAdUrls();

  return [...staticRoutes, ...dynamicRoutes];
}

async function getDynamicAdUrls(): Promise<MetadataRoute.Sitemap> {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabase) {
    return [];
  }

  try {
    const supabase = createClient();
    const { data: ads, error } = await supabase
      .from("ads")
      .select("id, updated_at")
      .eq("is_active", true);

    if (error || !ads?.length) {
      return [];
    }

    return ads.map((ad) => ({
      url: `${BASE_URL}/ad/${ad.id}`,
      lastModified: ad.updated_at ? new Date(ad.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}
