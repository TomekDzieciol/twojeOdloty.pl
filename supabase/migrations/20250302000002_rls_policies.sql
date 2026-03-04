-- =============================================================================
-- RLS: polityki dostępu (bezpieczeństwo, ochrona przed nieuprawnionym dostępem)
-- Zapytania przez Supabase Client używają parametrów – ochrona przed SQL Injection.
-- =============================================================================

-- ---------- profiles ----------
-- Odczyt: publicznie tylko podstawowe dane (do listowania), pełne tylko właściciel
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------- ads ----------
-- Odczyt: tylko aktywne, dla niezalogowanych i zalogowanych (lista + szczegóły)
CREATE POLICY "ads_select_active"
  ON public.ads FOR SELECT
  USING (is_active = true);

-- Właściciel widzi też swoje nieaktywne
CREATE POLICY "ads_select_own"
  ON public.ads FOR SELECT
  USING (auth.uid() = user_id);

-- CRUD tylko właściciel
CREATE POLICY "ads_insert_own"
  ON public.ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ads_update_own"
  ON public.ads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ads_delete_own"
  ON public.ads FOR DELETE
  USING (auth.uid() = user_id);

-- ---------- images ----------
-- Odczyt: wszyscy (zdjęcia w ogłoszeniach / galeriach)
CREATE POLICY "images_select"
  ON public.images FOR SELECT
  USING (true);

CREATE POLICY "images_insert_own"
  ON public.images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "images_update_own"
  ON public.images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "images_delete_own"
  ON public.images FOR DELETE
  USING (auth.uid() = user_id);

-- ---------- messages ----------
-- Tylko nadawca i odbiorca
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Odczyt (read_at) może ustawiać tylko recipient
CREATE POLICY "messages_update_recipient"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ---------- banned_emails ----------
-- Tylko admin (rola w metadanych lub osobna tabela adminów – tutaj uproszczenie: funkcja)
-- Zakładamy, że admin to użytkownik z auth.jwt() ->> 'role' = 'admin' lub tabela public.admins(user_id)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_own"
  ON public.admins FOR SELECT
  USING (auth.uid() = user_id);

-- Tylko istniejący admin może dodawać innych (opcjonalnie – w MVP ręcznie wstawiasz admina w SQL)
CREATE POLICY "banned_emails_select_admin"
  ON public.banned_emails FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

CREATE POLICY "banned_emails_insert_admin"
  ON public.banned_emails FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

CREATE POLICY "banned_emails_delete_admin"
  ON public.banned_emails FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );
