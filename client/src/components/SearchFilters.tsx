import { useState } from 'react'
import styles from './SearchFilters.module.css'

type Filters = { city?: string; gender?: string; query?: string }

type Props = {
  value: Filters
  onChange: (f: Filters) => void
  className?: string
}

export default function SearchFilters({ value, onChange, className }: Props) {
  const [localQuery, setLocalQuery] = useState(value.query ?? '')

  const applyQuery = () => {
    onChange({ ...value, query: localQuery.trim() || undefined })
  }

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <input
        type="text"
        placeholder="Szukaj w tytule…"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && applyQuery()}
        className={styles.input}
      />
      <input
        type="text"
        placeholder="Miasto"
        value={value.city ?? ''}
        onChange={(e) => onChange({ ...value, city: e.target.value.trim() || undefined })}
        className={styles.input}
      />
      <select
        value={value.gender ?? ''}
        onChange={(e) => onChange({ ...value, gender: e.target.value || undefined })}
        className={styles.select}
      >
        <option value="">Wszystkie płcie</option>
        <option value="M">Mężczyzna</option>
        <option value="F">Kobieta</option>
        <option value="other">Inna</option>
        <option value="any">Dowolna</option>
      </select>
      <button type="button" onClick={applyQuery} className={styles.button}>
        Szukaj
      </button>
    </div>
  )
}
