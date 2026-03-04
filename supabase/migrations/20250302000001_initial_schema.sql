-- =============================================================================
-- TowjeOdloty.pl – schemat bazy (MVP)
-- Uwaga: Użytkownicy = auth.users (Supabase Auth). Hasła hashowane po stronie Supabase.
-- =============================================================================

-- Enum: płeć / typ ogłoszeniodawcy
CREATE TYPE public.ad_gender AS ENUM ('male', 'female', 'couple');

-- Tabela: profile (rozszerzenie auth.users – dane widoczne w portalu)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  city TEXT,
  phone TEXT,
  birth_date DATE,
  age_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: ogłoszenia
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  gender public.ad_gender NOT NULL,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ads_user_id ON public.ads(user_id);
CREATE INDEX idx_ads_is_active ON public.ads(is_active);
CREATE INDEX idx_ads_gender ON public.ads(gender);
CREATE INDEX idx_ads_city ON public.ads(city);
CREATE INDEX idx_ads_created_at ON public.ads(created_at DESC);

-- Pełnotekstowe wyszukiwanie po tytule (i opcjonalnie treści)
-- Używamy 'simple' – konfiguracja 'polish' nie jest domyślnie dostępna w PostgreSQL/Supabase
CREATE INDEX idx_ads_title_fts ON public.ads USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, '')));

-- Tabela: zdjęcia (1 profilowe + max 6 w galerii per użytkownik)
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  is_profile BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_images_one_profile_per_user ON public.images(user_id) WHERE is_profile = true;
CREATE INDEX idx_images_user_id ON public.images(user_id);

-- Tabela: wiadomości (konwersacje / czat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Tabela: zbanowane adresy e-mail (admin)
CREATE TABLE public.banned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_banned_emails_email ON public.banned_emails(email);

-- Trigger: aktualizacja updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatyczne utworzenie profilu po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Włączenie RLS na wszystkich tabelach
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
