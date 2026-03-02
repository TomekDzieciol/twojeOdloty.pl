import { useMemo } from 'react'
import { getAgeVerified } from '../context/AuthContext'

export function useAgeGate(): boolean {
  return useMemo(() => getAgeVerified(), [typeof document !== 'undefined' ? document.cookie : ''])
}
