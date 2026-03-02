import { supabase } from './supabase'
import type { Image } from '../types/database'

const BUCKET = 'images'
const PROFILE_PREFIX = 'profile'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_PROFILE_IMAGES = 7 // 1 profilowe + 6 w galerii

function getExtension(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mime] ?? 'jpg'
}

/**
 * Liczba zdjęć użytkownika (owner_type=profile, owner_id=userId).
 */
export async function getProfileImageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('owner_type', 'profile')
    .eq('owner_id', userId)
  if (error) return 0
  return count ?? 0
}

/**
 * Upload zdjęcia do Storage i zapis w public.images (owner_type: profile).
 * isProfile: true = zdjęcie profilowe (max 1), false = galeria (max 6). Łącznie max 7.
 */
export async function uploadProfileImage(
  file: File,
  userId: string,
  isProfile: boolean
): Promise<{ data: Image | null; error: string | null }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { data: null, error: 'Dozwolone formaty: JPEG, PNG, GIF, WebP.' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { data: null, error: 'Maksymalny rozmiar pliku to 5 MB.' }
  }

  const count = await getProfileImageCount(userId)
  if (count >= MAX_PROFILE_IMAGES) {
    return { data: null, error: 'Możesz dodać łącznie 7 zdjęć (1 profilowe + 6 w galerii).' }
  }
  if (isProfile) {
    const { data: existing } = await supabase
      .from('images')
      .select('id')
      .eq('owner_type', 'profile')
      .eq('owner_id', userId)
      .eq('is_profile', true)
      .maybeSingle()
    if (existing) {
      return { data: null, error: 'Masz już zdjęcie profilowe. Ustaw je w galerii lub usuń najpierw.' }
    }
  }

  const ext = getExtension(file.type)
  const path = `${PROFILE_PREFIX}/${userId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { data: null, error: uploadError.message }
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = urlData.publicUrl

  const { data: row, error: insertError } = await supabase
    .from('images')
    .insert({
      owner_type: 'profile',
      owner_id: userId,
      url,
      sort_order: 0,
      is_profile: isProfile,
    } as Record<string, unknown>)
    .select('*')
    .single()

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path])
    return { data: null, error: insertError.message }
  }

  return { data: row as Image, error: null }
}

/**
 * Ustawia zdjęcie jako profilowe (reszta dla tego użytkownika ustawiana na nie-profilowe).
 */
export async function setProfileImage(
  imageId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { data: img } = await supabase
    .from('images')
    .select('id, owner_type, owner_id')
    .eq('id', imageId)
    .single()
  if (!img || img.owner_type !== 'profile' || img.owner_id !== userId) {
    return { error: 'Brak uprawnień.' }
  }

  const { error: unsetError } = await supabase
    .from('images')
    .update({ is_profile: false } as Record<string, unknown>)
    .eq('owner_type', 'profile')
    .eq('owner_id', userId)
  if (unsetError) return { error: unsetError.message }

  const { error: setError } = await supabase
    .from('images')
    .update({ is_profile: true } as Record<string, unknown>)
    .eq('id', imageId)
  if (setError) return { error: setError.message }

  return { error: null }
}

/**
 * Usuwa zdjęcie: wpis z public.images oraz plik ze Storage (jeśli URL wskazuje na bucket images).
 */
export async function deleteProfileImage(
  image: Image,
  userId: string
): Promise<{ error: string | null }> {
  if (image.owner_type !== 'profile' || image.owner_id !== userId) {
    return { error: 'Brak uprawnień.' }
  }

  const { error: deleteRowError } = await supabase
    .from('images')
    .delete()
    .eq('id', image.id)

  if (deleteRowError) return { error: deleteRowError.message }

  const path = getStoragePathFromUrl(image.url)
  if (path) {
    await supabase.storage.from(BUCKET).remove([path])
  }

  return { error: null }
}

function getStoragePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
