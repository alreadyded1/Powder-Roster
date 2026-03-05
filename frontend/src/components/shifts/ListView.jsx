import { useState } from 'react'
import FillIndicator from './FillIndicator'

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${ampm}`
}

export default function ListView({ shifts, onEdit, onDelete, onAssign }) {
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('asc')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...shifts].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey]
    if (sortKey === 'date') { av = a.date + a.start_time; bv = b.date + b.start_time }
    if (sortKey === 'fill') { av = a.assigned_count / (a.volunteers_needed || 1); bv = b.assigned_count / (b.volunteers_needed || 1) }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortHeader = ({ k, children }) => (
    <th
      className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortKey === k && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  )

  const handleDelete = async (shift) => {
    try {
      await onDelete(shift)
    } finally {
      setDeleteConfirm(null)
    }
  }

  if (!shifts.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No shifts yet. Create your first shift or use Bulk Create.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <SortHeader k="date">Date</SortHeader>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
              <SortHeader k="title">Title</SortHeader>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
              <SortHeader k="fill">Slots</SortHeader>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {formatDate(shift.date)}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{shift.title}</td>
                <td className="px-4 py-3 text-gray-500">{shift.location ?? '—'}</td>
                <td className="px-4 py-3">
                  <FillIndicator shift={shift} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onAssign && onAssign(shift)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => onEdit(shift)}
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(shift)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h4 className="text-base font-bold text-gray-900 mb-2">Delete shift?</h4>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{deleteConfirm.title}</strong> on {formatDate(deleteConfirm.date)} will be
              permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
