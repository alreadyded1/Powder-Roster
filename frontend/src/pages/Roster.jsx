import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import { useSeason } from '../context/SeasonContext'
import { rosterApi } from '../api/roster'

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

const ROLE_BADGE = {
  volunteer: 'bg-gray-100 text-gray-600',
  manager: 'bg-blue-100 text-blue-700',
}

function CountBadge({ count }) {
  const color =
    count === 0 ? 'bg-gray-100 text-gray-400' :
    count < 3   ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${color}`}>
      {count}
    </span>
  )
}

export default function Roster() {
  const { selectedSeason } = useSeason()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [expanded, setExpanded] = useState(new Set())

  const load = useCallback(async () => {
    if (!selectedSeason) return
    setLoading(true)
    try {
      setEntries(await rosterApi.list(selectedSeason.id))
    } finally {
      setLoading(false)
    }
  }, [selectedSeason?.id])

  useEffect(() => { load() }, [load])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleExport = async () => {
    if (!selectedSeason) return
    setExporting(true)
    try {
      await rosterApi.exportCsv(selectedSeason.id, selectedSeason.name)
    } finally {
      setExporting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    )
  }, [entries, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'confirmed_count' ? a.confirmed_count : a[sortKey]
      const bv = sortKey === 'confirmed_count' ? b.confirmed_count : b[sortKey]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const SortTh = ({ k, children, className = '' }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  )

  if (!selectedSeason) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium text-gray-500">No season selected</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Volunteer Roster</h2>
            <p className="text-sm text-gray-500 mt-0.5">{selectedSeason.name}</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting…' : '↓ Export CSV'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? 'No results match your search.' : 'No volunteers found.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-4 py-3" />
                  <SortTh k="name">Name</SortTh>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Email
                  </th>
                  <SortTh k="role">Role</SortTh>
                  <SortTh k="confirmed_count" className="text-center">Shifts</SortTh>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => {
                  const isOpen = expanded.has(entry.user_id)
                  return (
                    <>
                      <tr
                        key={entry.user_id}
                        onClick={() => entry.confirmed_count > 0 && toggleExpand(entry.user_id)}
                        className={`border-b border-gray-50 transition-colors ${
                          entry.confirmed_count > 0 ? 'cursor-pointer hover:bg-gray-50' : ''
                        } ${isOpen ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-center text-gray-300">
                          {entry.confirmed_count > 0 && (
                            <span className="text-xs">{isOpen ? '▼' : '▶'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {entry.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              ROLE_BADGE[entry.role] ?? 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {entry.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CountBadge count={entry.confirmed_count} />
                        </td>
                      </tr>

                      {/* Expanded shift list */}
                      {isOpen && (
                        <tr key={`${entry.user_id}-shifts`} className="bg-blue-50">
                          <td colSpan={5} className="px-8 pb-3 pt-0">
                            <div className="border border-blue-100 rounded-lg overflow-hidden bg-white">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-blue-50 text-left">
                                    <th className="px-3 py-2 font-medium text-blue-700">Date</th>
                                    <th className="px-3 py-2 font-medium text-blue-700">Time</th>
                                    <th className="px-3 py-2 font-medium text-blue-700">Title</th>
                                    <th className="px-3 py-2 font-medium text-blue-700 hidden sm:table-cell">
                                      Location
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {entry.shifts.map((s) => (
                                    <tr key={s.shift_id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                        {formatDate(s.date)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                        {formatTime(s.start_time)}–{formatTime(s.end_time)}
                                      </td>
                                      <td className="px-3 py-2 font-medium text-gray-900">
                                        {s.title}
                                      </td>
                                      <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">
                                        {s.location ?? '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && sorted.length > 0 && (
          <p className="text-xs text-gray-400">
            {sorted.length} {sorted.length === 1 ? 'person' : 'people'}
            {search ? ' matching' : ''} ·{' '}
            {sorted.reduce((sum, e) => sum + e.confirmed_count, 0)} total confirmed assignments
          </p>
        )}
      </div>
    </Layout>
  )
}
