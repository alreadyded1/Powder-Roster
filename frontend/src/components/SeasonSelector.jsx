import { useSeason } from '../context/SeasonContext'
import { getSeasonStatus } from './SeasonBadge'

const STATUS_COLOR = {
  active: 'text-green-600',
  upcoming: 'text-blue-600',
  past: 'text-gray-400',
}

export default function SeasonSelector() {
  const { seasons, selectedSeason, setSelectedSeason } = useSeason()

  if (!seasons.length) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 hidden sm:block">Season:</span>
      <select
        value={selectedSeason?.id ?? ''}
        onChange={(e) => {
          const s = seasons.find((s) => s.id === Number(e.target.value))
          setSelectedSeason(s ?? null)
        }}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {seasons.map((s) => {
          const status = getSeasonStatus(s)
          return (
            <option key={s.id} value={s.id} className={STATUS_COLOR[status]}>
              {s.name}
              {status === 'active' ? ' ●' : ''}
            </option>
          )
        })}
      </select>
    </div>
  )
}
