-- Naprawa infinite recursion w politykach RLS dla profiles.
-- Polityki odwoływały się do (SELECT role FROM public.profiles WHERE id = auth.uid()),
-- co przy sprawdzaniu dostępu do profiles powodowało rekurencję.
-- Rozwiązanie: funkcja SECURITY DEFINER czyta role bez RLS.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Usunięcie starych polityk na profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Ponowne utworzenie bez rekurencji (używamy get_my_role())
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_my_role() = 'admin');

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'admin');

-- partners: zamiana subquery na get_my_role()
DROP POLICY IF EXISTS "partners_select" ON public.partners;
DROP POLICY IF EXISTS "partners_update" ON public.partners;

CREATE POLICY "partners_select" ON public.partners
  FOR SELECT USING (user_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY "partners_update" ON public.partners
  FOR UPDATE USING (user_id = auth.uid() OR public.get_my_role() = 'admin');

-- ads: zamiana subquery na get_my_role()
DROP POLICY IF EXISTS "ads_select_public" ON public.ads;
DROP POLICY IF EXISTS "ads_update" ON public.ads;
DROP POLICY IF EXISTS "ads_delete" ON public.ads;

CREATE POLICY "ads_select_public" ON public.ads
  FOR SELECT USING (
    status = 'active'
    OR partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );

CREATE POLICY "ads_update" ON public.ads
  FOR UPDATE USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );

CREATE POLICY "ads_delete" ON public.ads
  FOR DELETE USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );
