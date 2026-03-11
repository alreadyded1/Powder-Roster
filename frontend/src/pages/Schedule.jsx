import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'
import { shiftsApi } from '../api/shifts'
import { assignmentsApi } from '../api/assignments'

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function Schedule() {
  const { user } = useAuth()
  const { selectedSeason, seasons, setSelectedSeason } = useSeason()
  const [shifts, setShifts] = useState([])
  const [myAssignments, setMyAssignments] = useState({}) // shift_id → assignment
  const [loading, setLoading] = useState(false)
  const [withdrawing, setWithdrawing] = useState({}) // shift_id → bool
  const [withdrawError, setWithdrawError] = useState({}) // shift_id → string

  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
  const activeSeason = seasons.find((s) => s.is_active) ?? seasons[0] ?? null
  const viewSeason = selectedSeason ?? activeSeason

  const load = useCallback(async () => {
    if (!viewSeason) return
    setLoading(true)
    try {
      const [s, a] = await Promise.all([
        shiftsApi.list(viewSeason.id),
        assignmentsApi.myAssignments(viewSeason.id),
      ])
      setShifts(s)
      const map = {}
      a.forEach((asgn) => { map[asgn.shift_id] = asgn })
      setMyAssignments(map)
    } finally {
      setLoading(false)
    }
  }, [viewSeason?.id])

  useEffect(() => { load() }, [load])

  const handleWithdraw = async (shift) => {
    setWithdrawing((p) => ({ ...p, [shift.id]: true }))
    setWithdrawError((p) => ({ ...p, [shift.id]: '' }))
    try {
      await assignmentsApi.withdraw(shift.id)
      await load()
    } catch (err) {
      setWithdrawError((p) => ({
        ...p,
        [shift.id]: err.response?.data?.detail || 'Withdrawal failed.',
      }))
    } finally {
      setWithdrawing((p) => ({ ...p, [shift.id]: false }))
    }
  }

  // Only shifts the user is signed up for
  const myShifts = shifts.filter((s) => myAssignments[s.id])
  const confirmedCount = myShifts.filter((s) => myAssignments[s.id]?.status === 'confirmed').length
  const selfSignupEnabled = viewSeason?.self_signup

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Schedule</h2>
          {viewSeason && (
            <p className="text-sm text-gray-500 mt-1">{viewSeason.name}</p>
          )}
        </div>

        {/* Season picker for volunteers with multiple seasons */}
        {!isManager && seasons.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Season:</label>
            <select
              value={viewSeason?.id ?? ''}
              onChange={(e) => {
                const s = seasons.find((s) => s.id === Number(e.target.value))
                setSelectedSeason(s ?? null)
              }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Summary card */}
        {viewSeason && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">
              You are scheduled for{' '}
              <span className="text-2xl font-bold">{confirmedCount}</span>{' '}
              {confirmedCount === 1 ? 'shift' : 'shifts'} this season.
            </p>
            {selfSignupEnabled && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                Self-signup open
              </span>
            )}
          </div>
        )}

        {/* Shifts table */}
        {!viewSeason ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium text-gray-500">No season available</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : myShifts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            You have no shifts scheduled for this season.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  {selfSignupEnabled && (
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myShifts.map((shift) => {
                  const asgn = myAssignments[shift.id]
                  const isWithdrawing = withdrawing[shift.id]
                  const rowError = withdrawError[shift.id]
                  return (
                    <>
                      <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {formatDate(shift.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {shift.title}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {shift.location ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            asgn?.status === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {asgn?.status ?? '—'}
                          </span>
                        </td>
                        {selfSignupEnabled && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleWithdraw(shift)}
                              disabled={isWithdrawing}
                              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                            >
                              {isWithdrawing ? 'Withdrawing…' : 'Withdraw'}
                            </button>
                          </td>
                        )}
                      </tr>
                      {rowError && (
                        <tr key={`${shift.id}-err`}>
                          <td colSpan={selfSignupEnabled ? 6 : 5} className="px-4 py-1">
                            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                              {rowError}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
