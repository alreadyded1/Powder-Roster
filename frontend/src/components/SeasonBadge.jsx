export function getSeasonStatus(season) {
  if (season.is_active) return 'active'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(season.start_date + 'T00:00:00')
  const end = new Date(season.end_date + 'T00:00:00')
  if (start > today) return 'upcoming'
  if (end < today) return 'past'
  return 'current'
}

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800 border-green-200',
  current: 'bg-teal-100 text-teal-800 border-teal-200',
  upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
  past: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_DOT = {
  active: 'bg-green-500',
  current: 'bg-teal-500',
  upcoming: 'bg-blue-500',
  past: 'bg-gray-400',
}

export default function SeasonBadge({ season }) {
  const status = getSeasonStatus(season)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
