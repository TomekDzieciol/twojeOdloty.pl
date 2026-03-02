import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Ad } from '../types/database'
import styles from './AdDetail.module.css'

export default function AdDetail() {
  const { id } = useParams<{ id: string }>()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single()
      .then(({ data }) => {
        setAd(data ?? null)
        setLoading(false)
      })
  }, [id])

  if (loading) return <p className={styles.loading}>Ładowanie…</p>
  if (!ad) return <p className={styles.error}>Ogłoszenie nie istnieje lub jest niedostępne.</p>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/home" className={styles.back}>← Strona główna</Link>
      </header>
      <main className={styles.main}>
        <article className={styles.article}>
          <h1>{ad.title}</h1>
          {(ad.location_city || ad.gender) && (
            <p className={styles.meta}>
              {ad.location_city}
              {ad.gender && ` · ${ad.gender}`}
            </p>
          )}
          {ad.body && <div className={styles.body}>{ad.body}</div>}
        </article>
      </main>
    </div>
  )
}
