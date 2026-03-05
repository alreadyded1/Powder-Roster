import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { rosterApi } from '../api/roster'
import { assignmentsApi } from '../api/assignments'

function StatCard({ label, value, sub, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'

  // Manager state
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Volunteer state
  const [myCount, setMyCount] = useState(null)
  const [countLoading, setCountLoading] = useState(false)

  useEffect(() => {
    if (!selectedSeason) return

    if (isManager) {
      setSummaryLoading(true)
      rosterApi
        .summary(selectedSeason.id)
        .then(setSummary)
        .catch(() => {})
        .finally(() => setSummaryLoading(false))
    } else {
      setCountLoading(true)
      assignmentsApi
        .myAssignments(selectedSeason.id)
        .then((data) => setMyCount(data.filter((a) => a.status === 'confirmed').length))
        .catch(() => {})
        .finally(() => setCountLoading(false))
    }
  }, [selectedSeason?.id, isManager])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {selectedSeason ? selectedSeason.name : 'No season selected.'}
          </p>
        </div>

        {isManager ? (
          <>
            {!selectedSeason ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
                No season selected. Go to{' '}
                <Link to="/seasons" className="font-medium underline">
                  Seasons
                </Link>{' '}
                to create or activate one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Active Volunteers"
                  value={summary?.active_volunteers ?? '—'}
                  loading={summaryLoading}
                />
                <StatCard
                  label="Open Shifts"
                  value={summary?.open_shifts ?? '—'}
                  sub={summary ? `of ${summary.total_shifts} total` : undefined}
                  loading={summaryLoading}
                />
                <StatCard
                  label="Season Fill Rate"
                  value={summary ? `${summary.fill_rate}%` : '—'}
                  loading={summaryLoading}
                />
                <StatCard
                  label="Upcoming (7 days)"
                  value={summary?.upcoming_shifts ?? '—'}
                  loading={summaryLoading}
                />
              </div>
            )}

            {selectedSeason && (
              <div className="flex gap-3 flex-wrap">
                <Link
                  to="/shifts"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Manage Shifts →
                </Link>
                <Link
                  to="/roster"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  View Roster →
                </Link>
              </div>
            )}
          </>
        ) : (
          /* Volunteer view */
          <div className="space-y-4">
            {!selectedSeason ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-500">
                No season is currently active.
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-5">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  {selectedSeason.name}
                </p>
                {countLoading ? (
                  <div className="h-10 w-32 bg-blue-100 rounded animate-pulse" />
                ) : (
                  <p className="text-blue-900">
                    You are scheduled for{' '}
                    <span className="text-4xl font-bold">{myCount ?? 0}</span>{' '}
                    {myCount === 1 ? 'shift' : 'shifts'} this season.
                  </p>
                )}
                <Link
                  to="/schedule"
                  className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View my schedule →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
