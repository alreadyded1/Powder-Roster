import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { auditApi } from '../api/audit'

const ACTION_LABELS = {
  'season.created': 'Season Created',
  'season.activated': 'Season Activated',
  'season.deactivated': 'Season Deactivated',
  'shift.created': 'Shift Created',
  'shift.deleted': 'Shift Deleted',
  'user.role_changed': 'Role Changed',
  'user.deactivated': 'User Deactivated',
  'user.reactivated': 'User Reactivated',
  'profile.updated': 'Profile Updated',
  'auth.password_changed': 'Password Changed',
}

const ACTION_COLORS = {
  'season.activated': 'bg-green-100 text-green-700',
  'season.deactivated': 'bg-gray-100 text-gray-600',
  'season.created': 'bg-blue-100 text-blue-700',
  'shift.created': 'bg-blue-100 text-blue-700',
  'shift.deleted': 'bg-red-100 text-red-700',
  'user.deactivated': 'bg-red-100 text-red-700',
  'user.reactivated': 'bg-green-100 text-green-700',
  'user.role_changed': 'bg-amber-100 text-amber-700',
  'profile.updated': 'bg-gray-100 text-gray-600',
  'auth.password_changed': 'bg-gray-100 text-gray-600',
}

function ActionBadge({ action }) {
  const label = ACTION_LABELS[action] ?? action
  const color = ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>
      {label}
    </span>
  )
}

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [actions, setActions] = useState([])
  const [filterAction, setFilterAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    auditApi.actions().then(setActions).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    auditApi
      .list({ action: filterAction || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE })
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterAction, page])

  const handleFilterChange = (v) => {
    setFilterAction(v)
    setPage(0)
  }

  const formatDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
            <p className="text-sm text-gray-500 mt-1">System activity history</p>
          </div>

          <select
            value={filterAction}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No log entries found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {entry.user_name}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {entry.detail ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + entries.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={entries.length < PAGE_SIZE}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
