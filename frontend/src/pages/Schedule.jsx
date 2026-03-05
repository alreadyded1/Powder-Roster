import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'
import { shiftsApi } from '../api/shifts'
import { assignmentsApi } from '../api/assignments'
import FillIndicator, { getFillStatus } from '../components/shifts/FillIndicator'

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
  const [myAssignments, setMyAssignments] = useState([]) // map shift_id → assignment
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState({}) // shift_id → error string
  const [acting, setActing] = useState({}) // shift_id → bool

  // For volunteers, pick the active season if no selection yet
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

  const handleSignup = async (shift) => {
    setActing((p) => ({ ...p, [shift.id]: true }))
    setActionError((p) => ({ ...p, [shift.id]: '' }))
    try {
      await assignmentsApi.signup(shift.id)
      await load()
    } catch (err) {
      setActionError((p) => ({
        ...p,
        [shift.id]: err.response?.data?.detail || 'Sign-up failed.',
      }))
    } finally {
      setActing((p) => ({ ...p, [shift.id]: false }))
    }
  }

  const handleWithdraw = async (shift) => {
    setActing((p) => ({ ...p, [shift.id]: true }))
    setActionError((p) => ({ ...p, [shift.id]: '' }))
    try {
      await assignmentsApi.withdraw(shift.id)
      await load()
    } catch (err) {
      setActionError((p) => ({
        ...p,
        [shift.id]: err.response?.data?.detail || 'Withdrawal failed.',
      }))
    } finally {
      setActing((p) => ({ ...p, [shift.id]: false }))
    }
  }

  const myCount = Object.values(myAssignments).filter((a) => a.status === 'confirmed').length
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
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

        {/* Season picker for volunteers */}
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

        {/* My count card */}
        {viewSeason && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                You are scheduled for{' '}
                <span className="text-2xl font-bold">{myCount}</span>{' '}
                {myCount === 1 ? 'shift' : 'shifts'} this season.
              </p>
            </div>
            {selfSignupEnabled && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                Self-signup open
              </span>
            )}
          </div>
        )}

        {/* Shifts */}
        {!viewSeason ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium text-gray-500">No season available</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No shifts scheduled for this season yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Time</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Location</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Slots</th>
                  {selfSignupEnabled && (
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shifts.map((shift) => {
                  const myAsgn = myAssignments[shift.id]
                  const isMine = !!myAsgn
                  const status = getFillStatus(shift)
                  const full = status === 'full' && !isMine
                  const isActing = acting[shift.id]
                  const rowError = actionError[shift.id]

                  return (
                    <>
                      <tr
                        key={shift.id}
                        className={`transition-colors ${isMine ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {formatDate(shift.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {shift.title}
                          {isMine && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                              myAsgn.status === 'confirmed'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {myAsgn.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {shift.location ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <FillIndicator shift={shift} compact={!isMine} />
                        </td>
                        {selfSignupEnabled && (
                          <td className="px-4 py-3 text-right">
                            {isMine ? (
                              <button
                                onClick={() => handleWithdraw(shift)}
                                disabled={isActing}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                              >
                                {isActing ? 'Withdrawing…' : 'Withdraw'}
                              </button>
                            ) : full ? (
                              <span className="text-xs text-gray-400">Full</span>
                            ) : (
                              <button
                                onClick={() => handleSignup(shift)}
                                disabled={isActing}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                              >
                                {isActing ? 'Signing up…' : 'Sign Up'}
                              </button>
                            )}
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
