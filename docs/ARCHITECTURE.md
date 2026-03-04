# Architektura i MVP – TowjeOdloty.pl

Portal ogłoszeniowy (Adult/Dating). Stos: **React**, **Node.js** (opcjonalnie API), **Supabase** (Auth, PostgreSQL, Storage, RLS).

---

## 1. Schemat bazy danych

### 1.1 Użytkownicy

- **auth.users** (Supabase Auth) – logowanie, hasła (hashowane po stronie Supabase), e-mail.
- **public.profiles** – rozszerzenie użytkownika:
  - `id` (PK, FK → auth.users)
  - `display_name`, `city`, `phone`, `birth_date`
  - `age_confirmed_at` – timestamp potwierdzenia pełnoletności (Age Gate)
  - `created_at`, `updated_at`

### 1.2 Ogłoszenia

- **public.ads**
  - `id`, `user_id` (FK → auth.users), `title`, `body`
  - `gender` (enum: male | female | couple)
  - `city`, `is_active`, `created_at`, `updated_at`
  - Indeksy: user_id, is_active, gender, city, created_at, FTS po title+body (polish).

### 1.3 Zdjęcia

- **public.images**
  - `id`, `user_id`, `path` (ścieżka w Storage), `is_profile` (boolean), `sort_order`, `created_at`
  - Ograniczenie w DB: 1 zdjęcie profilowe + max 6 w galerii (trigger).

### 1.4 Wiadomości

- **public.messages**
  - `id`, `sender_id`, `recipient_id`, `ad_id` (opcjonalnie), `body`, `read_at`, `created_at`

### 1.5 Admin i bany

- **public.admins** – `user_id` (PK, FK → auth.users). Ręczne dodanie pierwszego admina w SQL.
- **public.banned_emails** – `email` (UNIQUE), `banned_by`, `reason`, `created_at`. Ban po adresie e-mail.

---

## 2. Bezpieczeństwo

| Zagadnienie | Realizacja |
|-------------|------------|
| **Hasła** | Supabase Auth (bcrypt/hash) – brak własnego hashowania. |
| **SQL Injection** | Zapytania wyłącznie przez Supabase Client (parametryzowane) lub RPC; brak składania SQL z wejścia użytkownika. |
| **Dostęp do danych** | RLS na tabelach i Storage; polityki per tabela (patrz migracje). |
| **Weryfikacja wieku** | Age Gate w UI (checkbox + opcjonalnie birth_date); zapis `age_confirmed_at` w profilu; treści tylko po wejściu przez Age Gate. |
| **Ban po e-mail** | Tabela `banned_emails`; po zalogowaniu aplikacja wywołuje `is_email_banned(email)` i blokuje dostęp (np. redirect na stronę „konto zablokowane”). |

---

## 3. Widoki i logika

### 3.1 Age Gate (Landing)

- **Cel:** Wejście tylko po potwierdzeniu pełnoletności; SEO dla robotów.
- **Ścieżka:** `/` lub `/age-gate`.
- **Logika:**
  - W sessionStorage/cookie zapisać flagę `ageGatePassed` (np. do 24h lub sesji).
  - Jeśli brak flagi → pokazać stronę Age Gate (tekst regulaminu, checkbox „Mam 18+”, przycisk „Wejdź”).
  - Po potwierdzeniu: ustaw flagę, przekieruj na `/home`.
  - Dla zalogowanych: opcjonalnie zapisać `age_confirmed_at` w `profiles` (jednorazowo).
- **SEO:**
  - Dla robotów (User-Agent: crawler / bot): zwracać osobną, uproszczoną wersję strony (meta description, canonical, og:image) **bez** wymuszania Age Gate, np. „Portal ogłoszeniowy 18+. Wejdź, aby zobaczyć treści.” – bez listy ogłoszeń.
  - W React: wykrycie robota po `navigator.userAgent` lub po stronie serwera (SSR/Node) – dla robotów renderować prosty HTML z meta tagami.

### 3.2 Strona główna (publiczna)

- **Ścieżka:** `/home`.
- **Zawartość:**
  - Zajawki profili: lista ostatnich/aktywnych ogłoszeń (np. 12–24) z miniaturami, tytułem, miastem, płcią.
  - Krótkie info o portalu + CTA „Zarejestruj się”.
  - Wyszukiwarka z filtrami:
    - **Lokalizacja** – pole tekstowe (city) lub select z listą miast.
    - **Płeć** – male / female / couple.
    - **Treść** – wyszukiwanie pełnotekstowe po tytule (i opcjonalnie body) – w Supabase: `filter('title', 'ilike', '%' + query + '%')` lub RPC z `to_tsvector`/`plainto_tsquery`.
- **Źródło danych:** `ads` gdzie `is_active = true`, join z `profiles` (display_name, city), zdjęcie profilowe z `images` gdzie `is_profile = true`.
- **Nie wymaga logowania.**

### 3.3 Dashboard użytkownika

- **Ścieżka:** `/dashboard`.
- **Dostęp:** Tylko zalogowany; jeśli `is_email_banned(email)` → przekierowanie na stronę „Konto zablokowane”.
- **Funkcje:**
  - **Profil:** edycja `profiles`: display_name, **miasto** (city), **nr telefonu** (phone). Zapisywanie przez `supabase.from('profiles').update(...).eq('id', userId)`.
  - **Zdjęcia:**
    - 1 zdjęcie profilowe (upload do Storage `images/{userId}/avatar.*`, wpis w `images` z `is_profile = true`).
    - Do 6 zdjęć w galerii (`is_profile = false`, `sort_order`). Upload do `images/{userId}/gallery/{id}.*`.
  - **Ogłoszenia:** lista własnych, dodawanie/edycja/usuwanie (CRUD na `ads`).
- **Walidacja po stronie klienta:** wymagane pola, format telefonu; po stronie DB – trigger na limit zdjęć.

### 3.4 Dashboard admina

- **Ścieżka:** `/dashboard/admin`.
- **Dostęp:** Tylko użytkownik występujący w `public.admins`.
- **Funkcje:**
  - **Zarządzanie użytkownikami:** lista użytkowników (np. z `profiles` + auth.users przez Admin API Supabase lub własny endpoint); **dodawanie** użytkowników (np. zaproszenie / rejestracja); **usuwanie** użytkowników (Supabase Admin API: `deleteUser`).
  - **Banowanie po e-mail:** formularz (e-mail + opcjonalnie reason) → `INSERT INTO banned_emails`. Odbanowanie: `DELETE FROM banned_emails WHERE email = ?`.
- **Bezpieczeństwo:** wszystkie mutacje tylko dla ról z `admins`; RLS na `banned_emails` i `admins`.

---

## 4. Przepływ rejestracji i Age Gate

1. Użytkownik wchodzi na stronę → Age Gate (jeśli brak flagi).
2. Po potwierdzeniu → Home. Może się zarejestrować (Supabase Auth: e-mail + hasło).
3. Po rejestracji: trigger tworzy wpis w `profiles`. Opcjonalnie w Dashboard użytkownik uzupełnia `birth_date` i zapisujemy `age_confirmed_at`.
4. Przy każdym wejściu zalogowanego użytkownika: sprawdzenie `is_email_banned(email)`; jeśli tak → blokada dostępu.

---

## 5. API / Supabase

- **React → Supabase bezpośrednio:** Auth (signUp, signIn, signOut), `supabase.from('profiles'|'ads'|'images'|'messages')`, `supabase.storage.from('images')`. RLS decyduje, co użytkownik może zobaczyć/zmienić.
- **Node.js (opcjonalnie):** Jeśli potrzebne (np. webhooki, e-maile, skomplikowana logika), endpointy mogą wywoływać Supabase z service_role i realizować akcje admina (np. ban, usunięcie użytkownika). W MVP wystarczy wywołania z klienta z RLS.

---

## 6. Pliki migracji (kolejność)

1. `20250302000001_initial_schema.sql` – tabele, indeksy, trigger `updated_at`, trigger `handle_new_user`, RLS włączone.
2. `20250302000002_rls_policies.sql` – polityki RLS dla profiles, ads, images, messages, banned_emails, tabela `admins`.
3. `20250302000003_storage_and_checks.sql` – bucket `images`, polityki Storage, trigger limitów zdjęć, funkcja `is_email_banned`.

**Dodanie pierwszego admina (ręcznie w SQL po rejestracji):**
```sql
INSERT INTO public.admins (user_id) VALUES ('uuid-uzytkownika-admina');
```

---

## 7. Struktura frontendu (React – propozycja)

```
src/
  pages/
    AgeGate.tsx       # Landing z weryfikacją 18+
    Home.tsx          # Strona główna + wyszukiwarka
    Dashboard.tsx     # User: profil, zdjęcia, ogłoszenia
    DashboardAdmin.tsx # Admin: użytkownicy, bany
  components/
    SearchFilters.tsx # Filtry: lokalizacja, płeć, treść
    AdCard.tsx        # Karta ogłoszenia (zajawka)
  context/
    AuthContext.tsx   # Session + sprawdzenie bana (is_email_banned)
  lib/
    supabase.ts       # Klient Supabase
```

Routing: Age Gate na `/`, Home na `/home`, Dashboard na `/dashboard`, Admin na `/dashboard/admin`. W `AuthContext` po zalogowaniu: wywołanie RPC `is_email_banned`; jeśli true – ustawienie stanu „banned” i przekierowanie.

---

## 8. Podsumowanie

- **Baza:** Supabase (auth.users + profiles, ads, images, messages, banned_emails, admins).
- **Bezpieczeństwo:** hasła w Auth, RLS, parametrized queries, Age Gate w UI, ban po e-mail z blokadą w aplikacji.
- **Widoki:** Age Gate (z SEO dla botów), Home (wyszukiwarka + zajawki), Dashboard (profil, zdjęcia 1+6, ogłoszenia), Dashboard Admin (użytkownicy, bany).

Po wdrożeniu migracji i zbudowaniu tych widoków masz spójny MVP gotowy do rozwoju.
