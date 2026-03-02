-- Jedno zdjęcie profilowe + do 6 w galerii (łącznie 7) dla owner_type='profile'
ALTER TABLE public.images
  ADD COLUMN IF NOT EXISTS is_profile BOOLEAN NOT NULL DEFAULT false;

-- Tylko jedno zdjęcie może być profilowym na dany profil
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_one_profile_per_owner
  ON public.images (owner_type, owner_id)
  WHERE is_profile = true;

COMMENT ON COLUMN public.images.is_profile IS 'Dla owner_type=profile: true = zdjęcie profilowe (max 1), false = galeria (max 6).';
