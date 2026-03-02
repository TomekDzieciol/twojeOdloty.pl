# TowjeOdloty.pl – portal ogłoszeniowy (MVP)

Portal z ogłoszeniami matrymonialnymi/towarzyskimi. Stos: **React (Vite)** + **Supabase** (Auth, PostgreSQL, Storage).

## Struktura projektu

- **client/** – aplikacja React (TypeScript)
- **supabase/migrations/** – migracje SQL (schemat bazy, RLS, triggery)

## Uruchomienie

### 1. Supabase

1. Załóż projekt na [supabase.com](https://supabase.com).
2. W Supabase Dashboard → SQL Editor uruchom zawartość pliku  
   `supabase/migrations/20250302000001_initial_schema.sql`.
3. Skopiuj **Project URL** i **anon public** key z Settings → API.

### 2. Frontend

```bash
cd client
cp .env.example .env
```

W pliku `.env` ustaw:

- `VITE_SUPABASE_URL` – URL projektu Supabase  
- `VITE_SUPABASE_ANON_KEY` – klucz anon (public)

```bash
npm install
npm run dev
```

Aplikacja działa pod adresem z Vite (np. http://localhost:5173).

## Widoki

- **/** – Age Gate (weryfikacja pełnoletniości), potem przekierowanie na /home
- **/home** – strona główna: lista ogłoszeń, wyszukiwarka (miasto, płeć, tytuł), CTA do rejestracji
- **/login**, **/register** – logowanie i rejestracja
- **/dashboard** – profil użytkownika (nazwa, miasto, tel., zdjęcia – upload w przygotowaniu)
- **/dashboard/partner** – panel partnera: profil, adres, zdjęcia, CRUD ogłoszeń
- **/admin** – panel admina: lista użytkowników (rola, ban), moderacja ogłoszeń (edycja, status)
- **/ad/:id** – szczegóły ogłoszenia (tylko status `active`)

## Baza danych (Supabase)

- **profiles** – rozszerzenie `auth.users`: rola (user/partner/admin), display_name, city, phone, email, is_banned
- **partners** – profil partnera: user_id, business_name, city, address, phone
- **ads** – ogłoszenia: partner_id, title, body, location_city, gender, status (draft/active/rejected/archived)
- **images** – zdjęcia (owner_type: profile/partner/ad, owner_id, url)
- **messages** – wiadomości przy ogłoszeniu (ad_id, sender_id, recipient_id, body)

Hasła: obsługa po stronie Supabase Auth (bcrypt). Zapytania: parametryzowane (Supabase client). Dostęp: RLS na wszystkich tabelach.

## Pierwszy admin

Rolę `admin` trzeba ustawić w bazie ręcznie (np. w Supabase SQL Editor):

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'UUID-twojego-konta';
```

UUID konta możesz wziąć z Supabase Dashboard → Authentication → Users.
