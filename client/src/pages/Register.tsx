import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1>Rejestracja</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <input
            type="text"
            placeholder="Nazwa wyświetlana"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Hasło (min. 6 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Rejestracja…' : 'Zarejestruj'}
          </button>
        </form>
        <p className={styles.footer}>
          Masz konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
