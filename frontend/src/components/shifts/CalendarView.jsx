import { useState, useMemo } from 'react'
import { getFillStatus } from './FillIndicator'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PILL_COLORS = {
  open: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-amber-100 text-amber-800 border-amber-200',
  full: 'bg-red-100 text-red-800 border-red-200',
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

export default function CalendarView({ shifts, onEdit }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  const shiftsByDate = useMemo(() => {
    const map = {}
    shifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [shifts])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // Build grid: weeks × 7 days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() // 0=Sun
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null
    const d = new Date(year, month, dayNum)
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return { dayNum, key, shifts: shiftsByDate[key] ?? [], date: d }
  })

  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isToday = (cell) =>
    cell &&
    cell.date.getFullYear() === today.getFullYear() &&
    cell.date.getMonth() === today.getMonth() &&
    cell.date.getDate() === today.getDate()

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          ←
        </button>
        <span className="text-base font-semibold text-gray-900">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`bg-white min-h-[100px] p-1.5 ${!cell ? 'bg-gray-50' : ''}`}
          >
            {cell && (
              <>
                <div
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday(cell)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500'
                  }`}
                >
                  {cell.dayNum}
                </div>
                <div className="space-y-0.5">
                  {cell.shifts.slice(0, 3).map((shift) => {
                    const status = getFillStatus(shift)
                    return (
                      <button
                        key={shift.id}
                        onClick={() => onEdit(shift)}
                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate leading-tight hover:opacity-80 transition-opacity ${PILL_COLORS[status]}`}
                        title={`${shift.title} — ${formatTime(shift.start_time)}`}
                      >
                        {formatTime(shift.start_time)} {shift.title}
                      </button>
                    )
                  })}
                  {cell.shifts.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">
                      +{cell.shifts.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
