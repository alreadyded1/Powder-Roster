export function getFillStatus(shift) {
  if (shift.assigned_count >= shift.volunteers_needed) return 'full'
  if (shift.assigned_count > 0) return 'partial'
  return 'open'
}

const STYLES = {
  open: { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  partial: { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  full: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

export default function FillIndicator({ shift, compact = false }) {
  const status = getFillStatus(shift)
  const { assigned_count, volunteers_needed } = shift
  const pct = volunteers_needed > 0 ? Math.min((assigned_count / volunteers_needed) * 100, 100) : 0
  const s = STYLES[status]

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${s.bg} ${s.text}`}>
        {assigned_count}/{volunteers_needed}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium tabular-nums ${s.text}`}>
        {assigned_count}/{volunteers_needed}
      </span>
    </div>
  )
}
