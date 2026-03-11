import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { seasonsApi } from '../api/seasons'
import { useAuth } from './AuthContext'

const SeasonContext = createContext(null)

export function SeasonProvider({ children }) {
  const { user } = useAuth()
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadSeasons = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await seasonsApi.list()
      setSeasons(data)
      // Default to the active season, then the most recent
      const active = data.find((s) => s.is_active)
      setSelectedSeason((prev) => prev ?? active ?? data[0] ?? null)
    } catch {
      // silently fail — auth errors handled by axios interceptor
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadSeasons()
  }, [user, loadSeasons])

  return (
    <SeasonContext.Provider
      value={{ seasons, selectedSeason, setSelectedSeason, loadSeasons, loading }}
    >
      {children}
    </SeasonContext.Provider>
  )
}

export const useSeason = () => useContext(SeasonContext)
