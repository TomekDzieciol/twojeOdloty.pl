-- Rozszerzenie auth.users: profil użytkownika (User/Partner/Admin)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'partner', 'admin')),
  display_name TEXT,
  city TEXT,
  phone TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profil partnera (rozszerzenie dla role=partner)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ogłoszenia
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  location_city TEXT,
  gender TEXT CHECK (gender IN ('M', 'F', 'other', 'any')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'rejected', 'archived')),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zdjęcia (profil użytkownika / partnera / ogłoszenia)
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('profile', 'partner', 'ad')),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wiadomości przy ogłoszeniu
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeksy
CREATE INDEX idx_ads_partner_id ON public.ads(partner_id);
CREATE INDEX idx_ads_status ON public.ads(status);
CREATE INDEX idx_ads_location_city ON public.ads(location_city);
CREATE INDEX idx_ads_gender ON public.ads(gender);
CREATE INDEX idx_ads_created_at ON public.ads(created_at DESC);
CREATE INDEX idx_images_owner ON public.images(owner_type, owner_id);
CREATE INDEX idx_messages_ad_id ON public.messages(ad_id);
CREATE INDEX idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Automatyczne utworzenie profilu po rejestracji (Supabase Auth hook)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (NEW.id, NEW.email, 'user', COALESCE(NEW.raw_user_meta_data->>'display_name', NULL));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles: użytkownik widzi tylko siebie; admin wszystkich
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- partners: właściciel i admin
CREATE POLICY "partners_select" ON public.partners
  FOR SELECT USING (
    user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
CREATE POLICY "partners_insert" ON public.partners
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "partners_update" ON public.partners
  FOR UPDATE USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ads: publicznie tylko active; właściciel i admin pełny dostęp
CREATE POLICY "ads_select_public" ON public.ads
  FOR SELECT USING (status = 'active' OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "ads_insert" ON public.ads
  FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));
CREATE POLICY "ads_update" ON public.ads
  FOR UPDATE USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "ads_delete" ON public.ads
  FOR DELETE USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- images: dostęp według owner_type/owner_id (uproszczone – w produkcji dokładne sprawdzenie)
CREATE POLICY "images_select" ON public.images
  FOR SELECT USING (true);
CREATE POLICY "images_insert" ON public.images
  FOR INSERT WITH CHECK (
    (owner_type = 'profile' AND owner_id = auth.uid())
    OR (owner_type = 'partner' AND owner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
    OR (owner_type = 'ad' AND owner_id IN (SELECT id FROM public.ads WHERE partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())))
  );
CREATE POLICY "images_update" ON public.images FOR UPDATE USING (true);
CREATE POLICY "images_delete" ON public.images FOR DELETE USING (true);

-- messages: uczestnicy konwersacji
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());
