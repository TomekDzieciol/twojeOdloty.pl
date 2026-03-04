-- Płeć w profilu: kobieta, mężczyzna, para (używa istniejącego enum ad_gender)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender public.ad_gender;
