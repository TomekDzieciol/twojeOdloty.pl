# Potwierdzanie konta przez Resend (SMTP w Supabase)

Konfiguracja wysyłki maili potwierdzających (rejestracja, reset hasła) przez zewnętrznego dostawcę **Resend** zamiast domyślnego SMTP Supabase. Wszystko ustawiasz w **Supabase Dashboard** i w panelu **Resend** – w aplikacji Next.js nie są potrzebne żadne zmiany kodu.

---

## Czego potrzebujesz od Resend

1. **Konto Resend** – [resend.com](https://resend.com) (darmowy tier: 3000 maili/mies., 100/dzień).
2. **Klucz API** – w Resend: [API Keys](https://resend.com/api-keys) → Create API Key. Będzie używany jako hasło SMTP w Supabase.
3. **Domena do wysyłki** (produkcja):
   - W Resend: [Domains](https://resend.com/domains) → Add Domain (np. `towjeodloty.pl` lub subdomena `auth.towjeodloty.pl`).
   - Dodać u rejestratora DNS rekordy **SPF** i **DKIM** (Resend pokaże dokładne wartości).
   - **Nadawca w Supabase musi być adresem z tej zweryfikowanej domeny** (np. `no-reply@towjeodloty.pl`). Inaczej Resend nie wyśle maila.

Do szybkiego testu możesz na start użyć domeny testowej Resend (jeśli dostępna w Twoim planie), a potem przełączyć na własną domenę.

---

## Kroki konfiguracji

### 1. Resend – dane SMTP

Po utworzeniu klucza API w Resend użyj stałych danych SMTP:

| Pole     | Wartość           |
|----------|-------------------|
| Host     | `smtp.resend.com` |
| Port     | `465`             |
| Username | `resend`          |
| Password | Twój **API Key** z Resend (np. `re_...`) |

Źródło: [Resend – Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp).

### 2. Supabase Dashboard – włączenie Custom SMTP

1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard) i wybierz projekt.
2. **Authentication** → **SMTP Settings** (lub **Email** w sekcji Notifications).
3. Włączyć **Custom SMTP** i uzupełnić:
   - **Sender email** – adres z zweryfikowanej domeny w Resend (np. `no-reply@twoja-domena.pl`).
   - **Sender name** – np. `TowjeOdloty.pl` lub `Potwierdzenie konta`.
   - **Host** – `smtp.resend.com`
   - **Port** – `465`
   - **Username** – `resend`
   - **Password** – klucz API z Resend.
4. Zapisać ustawienia.

Po zapisaniu Supabase będzie wysyłać maile przez Resend. Limit domyślny Supabase to 30 maili/godz.; w razie potrzeby zmień go w **Authentication** → **Rate Limits**.

### 3. Redirect URLs w Supabase

W **Authentication** → **URL Configuration** ustaw:

- **Site URL** – np. `https://towjeodloty.pl` (produkcja) lub `http://localhost:3000` (dev).
- **Redirect URLs** – adresy, na które Supabase może przekierować po kliknięciu linku z maila, np.:
  - `https://towjeodloty.pl/dashboard`
  - `http://localhost:3000/dashboard`

Aplikacja w `app/register/page.tsx` ustawia `emailRedirectTo: ${window.location.origin}/dashboard`, więc te URL-e muszą być na liście Redirect URLs.

---

## Dokumentacja zewnętrzna

- [Send emails with custom SMTP | Supabase Docs](https://supabase.com/docs/guides/auth/auth-smtp)
- [Send emails using Supabase with SMTP | Resend](https://resend.com/docs/send-with-supabase-smtp)

---

## Checklist

- [ ] Konto Resend, utworzony API Key.
- [ ] (Produkcja) Domena dodana w Resend, SPF/DKIM w DNS, status „Verified”.
- [ ] Supabase → Authentication → SMTP: Custom SMTP włączone, dane Resend (host, port, user, password, sender email/name).
- [ ] Supabase → URL Configuration: Site URL i Redirect URLs zgodne z aplikacją.

Po tym maile potwierdzające rejestracji i „Wyślij ponownie” będą szły przez Resend.
