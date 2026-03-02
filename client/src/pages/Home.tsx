import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Ad } from '../types/database'
import SearchFilters from '../components/SearchFilters'
import AdCard from '../components/AdCard'
import styles from './Home.module.css'

export default function Home() {
  const { user, profile } = useAuth()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryTrigger, setRetryTrigger] = useState(0)
  const [filters, setFilters] = useState<{ city?: string; gender?: string; query?: string }>({})

  useEffect(() => {
    setError(null)
    setLoading(true)
    let query = supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24)

    if (filters.city) query = query.ilike('location_city', `%${filters.city}%`)
    if (filters.gender) query = query.eq('gender', filters.gender)
    if (filters.query?.trim()) query = query.ilike('title', `%${filters.query.trim()}%`)

    query
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message ?? 'Nie udało się załadować ogłoszeń.')
          setAds([])
        } else {
          setAds(data ?? [])
        }
      })
      .catch((err) => {
        setError(err?.message ?? 'Nie udało się załadować ogłoszeń. Sprawdź połączenie z internetem.')
        setAds([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [filters, retryTrigger])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/home" className={styles.logo}>TowjeOdloty.pl</Link>
          <nav className={styles.nav}>
            {user ? (
              <>
                <Link to="/dashboard">Mój profil</Link>
                {profile?.role === 'partner' && <Link to="/dashboard/partner">Panel partnera</Link>}
                {profile?.role === 'admin' && <Link to="/admin">Panel admina</Link>}
                <Link to="/" onClick={() => supabase.auth.signOut()}>Wyloguj</Link>
              </>
            ) : (
              <>
                <Link to="/login">Zaloguj</Link>
                <Link to="/register">Rejestracja</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Ogłoszenia towarzyskie</h1>
          <p>Portal z ogłoszeniami matrymonialnymi i towarzyskimi. Przeglądaj, wyszukuj i dodawaj własne ogłoszenia.</p>
        </section>

        <SearchFilters value={filters} onChange={setFilters} className={styles.filters} />

        <section className={styles.adsSection}>
          <h2>Ostatnie ogłoszenia</h2>
          {loading ? (
            <p className={styles.loading}>Ładowanie…</p>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button type="button" className={styles.errorButton} onClick={() => setRetryTrigger((t) => t + 1)}>
                Spróbuj ponownie
              </button>
            </div>
          ) : ads.length === 0 ? (
            <p className={styles.empty}>Brak ogłoszeń spełniających kryteria.</p>
          ) : (
            <ul className={styles.adList}>
              {ads.map((ad) => (
                <li key={ad.id}>
                  <AdCard ad={ad} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {!user && (
          <section className={styles.cta}>
            <h2>Dołącz do nas</h2>
            <p>Zarejestruj się, aby dodawać ogłoszenia i kontaktować się z innymi.</p>
            <Link to="/register" className={styles.ctaButton}>Zarejestruj się</Link>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© TowjeOdloty.pl – portal ogłoszeniowy.</p>
      </footer>
    </div>
  )
}
