-- Bucket na zdjęcia (profil, partner, ogłoszenia). Publiczny odczyt, zapis tylko do własnego folderu.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS na storage.objects (domyślnie włączone) – polityki dla bucketu 'images'

-- Odczyt: wszyscy (bucket publiczny)
CREATE POLICY "images_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Wstawienie: tylko zalogowani, do folderu profile/<własny_uid>/
CREATE POLICY "images_profile_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profile'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Aktualizacja: tylko właściciel pliku (folder profile/<uid>/)
CREATE POLICY "images_profile_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profile'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profile'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Usuwanie: tylko właściciel
CREATE POLICY "images_profile_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'profile'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
