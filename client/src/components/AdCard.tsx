import { Link } from 'react-router-dom'
import type { Ad } from '../types/database'
import styles from './AdCard.module.css'

type Props = { ad: Ad }

export default function AdCard({ ad }: Props) {
  return (
    <Link to={`/ad/${ad.id}`} className={styles.card}>
      <h3 className={styles.title}>{ad.title}</h3>
      {ad.location_city && <span className={styles.meta}>{ad.location_city}</span>}
      {ad.gender && <span className={styles.meta}> · {ad.gender}</span>}
      {ad.body && <p className={styles.body}>{ad.body.slice(0, 120)}…</p>}
    </Link>
  )
}
