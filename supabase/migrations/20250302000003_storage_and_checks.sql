-- =============================================================================
-- Storage: bucket na zdjęcia użytkowników + walidacja wieku (1 profil + 6 galeria)
-- =============================================================================

-- Bucket na zdjęcia (tylko zalogowani, rozmiar/typ w aplikacji)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS storage: użytkownik może wstawiać/aktualizować/usuwać tylko swoje pliki
-- Ścieżka: user_id/xxx lub {user_id}/filename
CREATE POLICY "images_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "images_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Ograniczenie: max 1 zdjęcie profilowe + 6 w galerii (enforced w aplikacji + funkcja)
CREATE OR REPLACE FUNCTION public.check_image_limits()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INT;
  gallery_count INT;
BEGIN
  IF NEW.is_profile THEN
    SELECT count(*) INTO profile_count
    FROM public.images
    WHERE user_id = NEW.user_id AND is_profile = true AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF profile_count >= 1 THEN
      RAISE EXCEPTION 'Może być tylko jedno zdjęcie profilowe.';
    END IF;
  ELSE
    SELECT count(*) INTO gallery_count
    FROM public.images
    WHERE user_id = NEW.user_id AND is_profile = false AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF gallery_count >= 6 THEN
      RAISE EXCEPTION 'Maksymalnie 6 zdjęć w galerii.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER images_limit_trigger
  BEFORE INSERT OR UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION public.check_image_limits();

-- Funkcja: czy e-mail jest zbanowany (do wywołania z aplikacji po zalogowaniu)
CREATE OR REPLACE FUNCTION public.is_email_banned(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.banned_emails WHERE email = lower(trim(check_email)));
$$;
