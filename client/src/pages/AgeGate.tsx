import { useNavigate } from 'react-router-dom'
import { setAgeVerified } from '../context/AuthContext'
import styles from './AgeGate.module.css'

export default function AgeGate() {
  const navigate = useNavigate()

  const handleConfirm = () => {
    setAgeVerified()
    navigate('/home', { replace: true })
  }

  return (
    <div className={styles.wrapper} role="main">
      <div className={styles.card}>
        <h1 className={styles.title}>Strona tylko dla osób pełnoletnich</h1>
        <p className={styles.text}>
          Aby wejść na portal, musisz mieć ukończone 18 lat.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={handleConfirm}>
            Tak, mam 18 lat
          </button>
          <a href="https://www.google.com" className={styles.btnSecondary}>
            Nie, opuszczam stronę
          </a>
        </div>
      </div>
    </div>
  )
}
