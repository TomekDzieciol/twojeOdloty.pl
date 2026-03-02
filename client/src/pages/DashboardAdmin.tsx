import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Profile, Ad } from '../types/database'
import styles from './DashboardAdmin.module.css'

export default function DashboardAdmin() {
  const { user, profile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [adTitle, setAdTitle] = useState('')
  const [adBody, setAdBody] = useState('')
  const [adStatus, setAdStatus] = useState<string>('')

  useEffect(() => {
    if (profile?.role !== 'admin') return
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data ?? []))
    supabase.from('ads').select('*').order('created_at', { ascending: false }).then(({ data }) => setAds(data ?? []))
  }, [profile?.role])

  const setUserRole = async (userId: string, role: Profile['role']) => {
    await supabase.from('profiles' as const).update({ role } as Record<string, unknown>).eq('id', userId)
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role } : p)))
  }

  const setUserBanned = async (userId: string, isBanned: boolean) => {
    await supabase.from('profiles' as const).update({ is_banned: isBanned } as Record<string, unknown>).eq('id', userId)
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, is_banned: isBanned } : p)))
  }

  const startEditAd = (ad: Ad) => {
    setEditingAd(ad)
    setAdTitle(ad.title)
    setAdBody(ad.body ?? '')
    setAdStatus(ad.status)
  }

  const saveAd = async () => {
    if (!editingAd) return
    await supabase
      .from('ads' as const)
      .update({ title: adTitle, body: adBody || null, status: adStatus as Ad['status'] } as Record<string, unknown>)
      .eq('id', editingAd.id)
    setAds((prev) => prev.map((a) => (a.id === editingAd.id ? { ...a, title: adTitle, body: adBody, status: adStatus as Ad['status'] } : a)))
    setEditingAd(null)
  }

  if (!user) return null
  if (profile?.role !== 'admin') {
    return (
      <div className={styles.page}>
        <p>Dostęp tylko dla administratorów.</p>
        <Link to="/dashboard">Wróć do profilu</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/home" className={styles.logo}>TowjeOdloty.pl – Admin</Link>
          <nav className={styles.nav}>
            <Link to="/dashboard">Profil</Link>
            <Link to="/dashboard/partner">Partner</Link>
            <Link to="/admin">Panel admina</Link>
            <Link to="/home">Strona główna</Link>
            <button type="button" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <h1>Panel administratora</h1>

        <section className={styles.section}>
          <h2>Użytkownicy</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nazwa</th>
                  <th>Rola</th>
                  <th>Zbanowany</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.email ?? p.id.slice(0, 8) + '…'}</td>
                    <td>{p.display_name ?? '–'}</td>
                    <td>
                      <select
                        value={p.role}
                        onChange={(e) => setUserRole(p.id, e.target.value as Profile['role'])}
                        className={styles.select}
                      >
                        <option value="user">user</option>
                        <option value="partner">partner</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{p.is_banned ? 'Tak' : 'Nie'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setUserBanned(p.id, !p.is_banned)}
                        className={styles.btnSmall}
                      >
                        {p.is_banned ? 'Odblokuj' : 'Zablokuj'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Moderacja ogłoszeń</h2>
          {editingAd ? (
            <div className={styles.editForm}>
              <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Tytuł" className={styles.input} />
              <textarea value={adBody} onChange={(e) => setAdBody(e.target.value)} placeholder="Treść" className={styles.textarea} rows={3} />
              <select value={adStatus} onChange={(e) => setAdStatus(e.target.value)} className={styles.select}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="rejected">rejected</option>
                <option value="archived">archived</option>
              </select>
              <div className={styles.editActions}>
                <button type="button" onClick={saveAd} className={styles.button}>Zapisz</button>
                <button type="button" onClick={() => setEditingAd(null)} className={styles.buttonSecondary}>Anuluj</button>
              </div>
            </div>
          ) : (
            <ul className={styles.adList}>
              {ads.map((ad) => (
                <li key={ad.id} className={styles.adItem}>
                  <strong>{ad.title}</strong>
                  <span className={styles.adStatus}>{ad.status}</span>
                  <button type="button" onClick={() => startEditAd(ad)} className={styles.btnSmall}>Edytuj</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
