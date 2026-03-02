import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { uploadProfileImage, deleteProfileImage, setProfileImage, MAX_PROFILE_IMAGES } from '../lib/imageUpload'
import type { Image } from '../types/database'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [images, setImages] = useState<Image[]>([])
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingProfileId, setSettingProfileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const refreshImages = () => {
    if (!user?.id) return
    supabase
      .from('images')
      .select('*')
      .eq('owner_type', 'profile')
      .eq('owner_id', user.id)
      .order('sort_order')
      .then(({ data }) => setImages(data ?? []))
  }

  const profileImage = images.find((img) => img.is_profile === true)
  const galleryImages = images.filter((img) => img.is_profile !== true)
  const canAddMore = images.length < MAX_PROFILE_IMAGES
  const canAddProfile = !profileImage && canAddMore
  const canAddGallery = canAddMore

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setCity(profile.city ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  useEffect(() => {
    if (user?.id) refreshImages()
  }, [user?.id])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    e.target.value = ''
    setImageError('')
    setUploading(true)
    const { data, error } = await uploadProfileImage(file, user.id, isProfile)
    setUploading(false)
    if (error) {
      setImageError(error)
      return
    }
    if (data) refreshImages()
  }

  const handleSetAsProfile = async (img: Image) => {
    if (!user?.id) return
    setSettingProfileId(img.id)
    setImageError('')
    const { error } = await setProfileImage(img.id, user.id)
    setSettingProfileId(null)
    if (error) setImageError(error)
    else refreshImages()
  }

  const handleDeleteImage = async (img: Image) => {
    if (!user?.id) return
    setDeletingId(img.id)
    setImageError('')
    const { error } = await deleteProfileImage(img, user.id)
    setDeletingId(null)
    if (error) setImageError(error)
    else refreshImages()
  }

  const SAVE_TIMEOUT_MS = 15_000

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setMessage('')
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), SAVE_TIMEOUT_MS)
      })
      const updatePromise = supabase
        .from('profiles' as const)
        .update({ display_name: displayName || null, city: city || null, phone: phone || null } as Record<string, unknown>)
        .eq('id', user.id)
      const { error } = await Promise.race([updatePromise, timeoutPromise])
      if (error) setMessage(error.message)
      else {
        setMessage('Zapisano.')
        refreshProfile()
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'timeout') {
        setMessage('Zapytanie trwało zbyt długo. Sprawdź połączenie i spróbuj ponownie.')
      } else {
        setMessage(err instanceof Error ? err.message : 'Wystąpił błąd.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/home" className={styles.logo}>TowjeOdloty.pl</Link>
          <nav className={styles.nav}>
            <Link to="/dashboard">Mój profil</Link>
            {profile?.role === 'partner' && <Link to="/dashboard/partner">Panel partnera</Link>}
            {profile?.role === 'admin' && <Link to="/admin">Panel admina</Link>}
            <Link to="/home">Strona główna</Link>
            <button type="button" onClick={() => supabase.auth.signOut()}>Wyloguj</button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <h1>Mój profil</h1>

        <section className={styles.section}>
          <h2>Zdjęcia</h2>
          {imageError && <p className={styles.imageError}>{imageError}</p>}

          <div className={styles.profilePhotoSection}>
            <h3 className={styles.subheading}>Zdjęcie profilowe</h3>
            {profileImage ? (
              <div className={styles.profileSlot}>
                <img src={profileImage.url} alt="Profilowe" className={styles.profileThumb} />
                <button
                  type="button"
                  className={styles.deleteImage}
                  onClick={() => handleDeleteImage(profileImage)}
                  disabled={deletingId === profileImage.id}
                  title="Usuń zdjęcie profilowe"
                >
                  ×
                </button>
              </div>
            ) : canAddProfile ? (
              <label className={styles.uploadLabelProfile}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleFileChange(e, true)}
                  disabled={uploading}
                  className={styles.uploadInput}
                />
                <span className={styles.uploadBoxProfile}>
                  {uploading ? 'Wgrywanie…' : '+ Dodaj zdjęcie profilowe'}
                </span>
              </label>
            ) : (
              <p className={styles.hint}>Zdjęcie profilowe (max 1). Dodaj je z galerii lub usuń inne.</p>
            )}
          </div>

          <div className={styles.gallerySection}>
            <h3 className={styles.subheading}>Galeria</h3>
            <p className={styles.hint}>Do 6 zdjęć w galerii. Łącznie z profilowym: 7 zdjęć.</p>
            <div className={styles.images}>
              {galleryImages.map((img) => (
                <div key={img.id} className={styles.imageWrap}>
                  <img src={img.url} alt="" className={styles.thumb} />
                  <button
                    type="button"
                    className={styles.deleteImage}
                    onClick={() => handleDeleteImage(img)}
                    disabled={deletingId === img.id}
                    title="Usuń zdjęcie"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    className={styles.setProfileBtn}
                    onClick={() => handleSetAsProfile(img)}
                    disabled={settingProfileId === img.id}
                    title="Ustaw jako zdjęcie profilowe"
                  >
                    {settingProfileId === img.id ? '…' : 'Profilowe'}
                  </button>
                </div>
              ))}
              {canAddGallery && (
                <label className={styles.uploadLabel}>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleFileChange(e, false)}
                    disabled={uploading}
                    className={styles.uploadInput}
                  />
                  <span className={styles.uploadBox}>
                    {uploading ? 'Wgrywanie…' : '+ Dodaj'}
                  </span>
                </label>
              )}
            </div>
          </div>
          <p className={styles.hint}>Formaty: JPEG, PNG, GIF, WebP. Maks. 5 MB.</p>
        </section>

        <section className={styles.section}>
          <h2>Ustawienia</h2>
          <form onSubmit={handleSave} className={styles.form}>
            {message && <p className={styles.message}>{message}</p>}
            <label>
              Nazwa wyświetlana
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.input}
              />
            </label>
            <label>
              Miasto
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="np. Warszawa"
                className={styles.input}
              />
            </label>
            <label>
              Nr telefonu
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="opcjonalnie"
                className={styles.input}
              />
            </label>
            <button type="submit" disabled={saving} className={styles.button}>
              {saving ? 'Zapisywanie…' : 'Zapisz'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
