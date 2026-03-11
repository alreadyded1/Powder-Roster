import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { seasonsApi } from '../api/seasons'
import { useAuth } from './AuthContext'

const SeasonContext = createContext(null)

export function SeasonProvider({ children }) {
  const { user } = useAuth()
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [loading, setLoading] = useState(false)

  // fetchSeasons has no dependency on user — the guard lives in the effect.
  // This avoids the stale-closure problem where useCallback captured user=null
  // from the first render and never re-created itself.
  const fetchSeasons = useCallback(async () => {
    setLoading(true)
    try {
      const data = await seasonsApi.list()
      setSeasons(data)
      const active = data.find((s) => s.is_active)
      setSelectedSeason((prev) => prev ?? active ?? data[0] ?? null)
    } catch {
      // silently fail — axios interceptor handles 401
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchSeasons()
    } else {
      setSeasons([])
      setSelectedSeason(null)
    }
  }, [user, fetchSeasons])

  return (
    <SeasonContext.Provider
      value={{ seasons, selectedSeason, setSelectedSeason, loadSeasons: fetchSeasons, loading }}
    >
      {children}
    </SeasonContext.Provider>
  )
}

export const useSeason = () => useContext(SeasonContext)
