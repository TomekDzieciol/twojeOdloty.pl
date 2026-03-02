import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Partner as PartnerType, Ad, Image } from '../types/database'
import styles from './DashboardPartner.module.css'

export default function DashboardPartner() {
  const { user, profile, refreshProfile } = useAuth()
  const [partner, setPartner] = useState<PartnerType | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [businessName, setBusinessName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [adTitle, setAdTitle] = useState('')
  const [adBody, setAdBody] = useState('')
  const [adCity, setAdCity] = useState('')
  const [adGender, setAdGender] = useState<string>('')

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        const d = data as PartnerType | null
        setPartner(d ?? null)
        if (d) {
          setBusinessName(d.business_name ?? '')
          setCity(d.city ?? '')
          setAddress(d.address ?? '')
          setPhone(d.phone ?? '')
        }
      })
  }, [user?.id])

  useEffect(() => {
    if (!partner?.id) return
    supabase
      .from('ads')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAds(data ?? []))
    supabase
      .from('images')
      .select('*')
      .eq('owner_type', 'partner')
      .eq('owner_id', partner.id)
      .order('sort_order')
      .then(({ data }) => setImages(data ?? []))
  }, [partner?.id])

  const ensurePartner = async (): Promise<PartnerType | null> => {
    if (partner) return partner
    if (!user?.id) return null
    const { data: existing } = await supabase.from('partners').select('*').eq('user_id', user.id).single()
    if (existing) {
      const row = existing as PartnerType
      setPartner(row)
      return row
    }
    const { data: created, error } = await supabase.from('partners' as const).insert({ user_id: user.id } as Record<string, unknown>).select('*').single()
    if (error) return null
    const row = created as PartnerType
    setPartner(row)
    return row
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = await ensurePartner()
    if (!p) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('partners' as const)
      .update({
        business_name: businessName || null,
        city: city || null,
        address: address || null,
        phone: phone || null,
      } as Record<string, unknown>)
      .eq('id', p.id)
    setSaving(false)
    if (error) setMessage(error.message)
    else setMessage('Zapisano.')
  }

  const startEditAd = (ad: Ad) => {
    setEditingAd(ad)
    setAdTitle(ad.title)
    setAdBody(ad.body ?? '')
    setAdCity(ad.location_city ?? '')
    setAdGender(ad.gender ?? '')
  }

  const cancelEdit = () => {
    setEditingAd(null)
  }

  const saveAd = async () => {
    if (!editingAd) return
    const { error } = await supabase
      .from('ads' as const)
      .update({
        title: adTitle,
        body: adBody || null,
        location_city: adCity || null,
        gender: (adGender || null) as Ad['gender'],
      } as Record<string, unknown>)
      .eq('id', editingAd.id)
    if (!error) {
      setAds((prev) => prev.map((a) => (a.id === editingAd.id ? { ...a, title: adTitle, body: adBody, location_city: adCity, gender: (adGender || null) as Ad['gender'] } : a)))
      setEditingAd(null)
    }
  }

  const createAd = async () => {
    const p = await ensurePartner()
    if (!p) return
    const { data, error } = await supabase
      .from('ads' as const)
      .insert({ partner_id: p.id, title: 'Nowe ogłoszenie', status: 'draft' } as Record<string, unknown>)
      .select('*')
      .single()
    if (!error && data) setAds((prev) => [data as Ad, ...prev])
  }

  const setAdStatus = async (adId: string, status: Ad['status']) => {
    await supabase.from('ads' as const).update({ status } as Record<string, unknown>).eq('id', adId)
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, status } : a)))
  }

  const deleteAd = async (adId: string) => {
    await supabase.from('ads').delete().eq('id', adId)
    setAds((prev) => prev.filter((a) => a.id !== adId))
    if (editingAd?.id === adId) setEditingAd(null)
  }

  const becomePartner = async () => {
    const p = await ensurePartner()
    if (!p) return
    await supabase.from('profiles' as const).update({ role: 'partner' } as Record<string, unknown>).eq('id', user!.id)
    refreshProfile()
  }

  if (!user) return null
  const isPartner = profile?.role === 'partner' || profile?.role === 'admin'
  if (!isPartner && !partner) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Panel partnera</h1>
          <p>Aby dodawać ogłoszenia, utwórz profil partnera.</p>
          <button type="button" onClick={becomePartner} className={styles.button}>Zostań partnerem</button>
          <Link to="/dashboard" className={styles.link}>Wróć do profilu</Link>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/home" className={styles.logo}>TowjeOdloty.pl</Link>
          <nav className={styles.nav}>
            <Link to="/dashboard">Mój profil</Link>
            <Link to="/dashboard/partner">Panel partnera</Link>
            {profile?.role === 'admin' && <Link to="/admin">Panel admina</Link>}
            <Link to="/home">Strona główna</Link>
            <button type="button" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <h1>Panel partnera</h1>

        <section className={styles.section}>
          <h2>Profil partnera i adres</h2>
          <form onSubmit={handleSaveProfile} className={styles.form}>
            {message && <p className={styles.message}>{message}</p>}
            <label>
              Nazwa firmy / działalności
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={styles.input} />
            </label>
            <label>
              Miasto
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={styles.input} />
            </label>
            <label>
              Adres (ulica, nr)
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={styles.input} />
            </label>
            <label>
              Telefon
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} />
            </label>
            <button type="submit" disabled={saving} className={styles.button}>{saving ? 'Zapisywanie…' : 'Zapisz'}</button>
          </form>
        </section>

        <section className={styles.section}>
          <h2>Zdjęcia</h2>
          <div className={styles.images}>
            {images.map((img) => (
              <div key={img.id} className={styles.imageWrap}>
                <img src={img.url} alt="" className={styles.thumb} />
              </div>
            ))}
            <p className={styles.hint}>Dodawanie zdjęć przez Storage – wkrótce.</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Ogłoszenia</h2>
          <button type="button" onClick={createAd} className={styles.button}>+ Dodaj ogłoszenie</button>
          <ul className={styles.adList}>
            {ads.map((ad) => (
              <li key={ad.id} className={styles.adItem}>
                {editingAd?.id === ad.id ? (
                  <div className={styles.editForm}>
                    <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Tytuł" className={styles.input} />
                    <textarea value={adBody} onChange={(e) => setAdBody(e.target.value)} placeholder="Treść" className={styles.textarea} rows={3} />
                    <input value={adCity} onChange={(e) => setAdCity(e.target.value)} placeholder="Miasto" className={styles.input} />
                    <select value={adGender} onChange={(e) => setAdGender(e.target.value)} className={styles.select}>
                      <option value="">–</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="other">Inna</option>
                      <option value="any">Dowolna</option>
                    </select>
                    <div className={styles.editActions}>
                      <button type="button" onClick={saveAd} className={styles.button}>Zapisz</button>
                      <button type="button" onClick={cancelEdit} className={styles.buttonSecondary}>Anuluj</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.adHeader}>
                      <strong>{ad.title}</strong>
                      <span className={styles.adStatus}>{ad.status}</span>
                    </div>
                    <div className={styles.adActions}>
                      <button type="button" onClick={() => startEditAd(ad)} className={styles.btnSmall}>Edytuj</button>
                      {ad.status === 'draft' && <button type="button" onClick={() => setAdStatus(ad.id, 'active')} className={styles.btnSmall}>Opublikuj</button>}
                      {ad.status === 'active' && <button type="button" onClick={() => setAdStatus(ad.id, 'archived')} className={styles.btnSmall}>Archiwizuj</button>}
                      <button type="button" onClick={() => deleteAd(ad.id)} className={styles.btnDanger}>Usuń</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
