"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ImageRecord } from "@/types/database";

interface DashboardPhotosProps {
  userId: string;
  images: ImageRecord[];
  baseUrl: string;
}

export default function DashboardPhotos({
  userId,
  images,
  baseUrl,
}: DashboardPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const profileImage = images.find((i) => i.is_profile);
  const galleryImages = images.filter((i) => !i.is_profile);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, asProfile: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so the same input can be used again
    setError("");
    setUploading(true);
    const supabase = createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setError("Musisz być zalogowany, aby dodać zdjęcie.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${authUser.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: false });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const isProfile = asProfile;
    const sortOrder = asProfile ? 0 : galleryImages.length;
    console.log("[DashboardPhotos] przed insert:", {
      asProfile,
      is_profile: isProfile,
      sort_order: sortOrder,
      galleryImagesCount: galleryImages.length,
    });

    const { error: insertErr } = await supabase.from("images").insert({
      user_id: authUser.id,
      path,
      is_profile: isProfile,
      sort_order: sortOrder,
    });

    if (insertErr) {
      setError(`${insertErr.message} (debug: is_profile=${isProfile}, asProfile=${asProfile})`);
      setUploading(false);
      return;
    }
    setUploading(false);
    window.location.reload();
  };

  const remove = async (id: string, path: string) => {
    const supabase = createClient();
    await supabase.from("images").delete().eq("id", id);
    await supabase.storage.from("images").remove([path]);
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Sekcja: tylko zdjęcie profilowe */}
      <div>
        <p className="text-xs text-[var(--muted)] mb-2">Zdjęcie profilowe</p>
        <div className="w-32">
          {profileImage ? (
            <div className="relative">
              <img
                src={`${baseUrl}/storage/v1/object/public/images/${profileImage.path}`}
                alt="Profil"
                className="aspect-square w-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => remove(profileImage.id, profileImage.path)}
                className="absolute -top-1 -right-1 rounded-full bg-red-500 w-5 h-5 text-white text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="block aspect-square w-32 rounded-lg border border-dashed border-[#2a2a32] cursor-pointer hover:border-brand-500 flex items-center justify-center text-[var(--muted)] text-xs">
              <input
                key="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => upload(e, true)}
                disabled={uploading}
              />
              + Dodaj
            </label>
          )}
        </div>
      </div>

      {/* Sekcja: galeria (do 6 zdjęć) */}
      <div>
        <p className="text-xs text-[var(--muted)] mb-2">Galeria (do 6 zdjęć)</p>
        <div className="flex flex-wrap gap-2">
          {galleryImages.map((img) => (
            <div key={img.id} className="w-24 relative">
              <img
                src={`${baseUrl}/storage/v1/object/public/images/${img.path}`}
                alt=""
                className="aspect-square w-24 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => remove(img.id, img.path)}
                className="absolute -top-1 -right-1 rounded-full bg-red-500 w-5 h-5 text-white text-xs"
              >
                ×
              </button>
            </div>
          ))}
          {galleryImages.length < 6 && (
            <label className="flex w-24 h-24 rounded-lg border border-dashed border-[#2a2a32] cursor-pointer hover:border-brand-500 items-center justify-center text-[var(--muted)] text-xs">
              <input
                key="gallery-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => upload(e, false)}
                disabled={uploading}
              />
              + Dodaj do galerii
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {uploading && <p className="text-sm text-[var(--muted)]">Wgrywanie…</p>}
    </div>
  );
}
