-- Opis profilu użytkownika (widoczny na stronie /profile/[userId])
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
