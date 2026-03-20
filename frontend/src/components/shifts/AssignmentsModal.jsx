import { useState, useEffect } from 'react'
import { assignmentsApi } from '../../api/assignments'
import api from '../../api/client'
import FillIndicator from './FillIndicator'

const STATUS_STYLES = {
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function AssignmentsModal({ shift, onClose, onChanged }) {
  const [assignments, setAssignments] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('confirmed')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [asgns, users] = await Promise.all([
        assignmentsApi.list(shift.id),
        api.get('/users/').then((r) => r.data),
      ])
      setAssignments(asgns)
      setVolunteers(users)
    } catch {
      setError('Failed to load assignment data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [shift.id])

  const assignedIds = new Set(
    assignments
      .filter((a) => a.status !== 'cancelled')
      .map((a) => a.user_id),
  )
  const available = volunteers.filter((v) => !assignedIds.has(v.id))

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    setError('')
    setAssigning(true)
    try {
      await assignmentsApi.assign({
        shift_id: shift.id,
        user_id: Number(selectedUserId),
        status: selectedStatus,
      })
      setSelectedUserId('')
      await load()
      onChanged()
    } catch (err) {
      setError(err.response?.data?.detail || 'Assignment failed.')
    } finally {
      setAssigning(false)
    }
  }

  const handleStatusChange = async (a, newStatus) => {
    try {
      await assignmentsApi.updateStatus(a.id, newStatus)
      await load()
      onChanged()
    } catch (err) {
      alert(err.response?.data?.detail || 'Update failed.')
    }
  }

  const handleUnassign = async (a) => {
    try {
      await assignmentsApi.unassign(a.id)
      await load()
      onChanged()
    } catch (err) {
      alert(err.response?.data?.detail || 'Remove failed.')
    }
  }

  const liveShift = { ...shift, assigned_count: assignments.filter((a) => a.status === 'confirmed').length }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{shift.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(shift.date)} · {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                {shift.location && ` · ${shift.location}`}
              </p>
            </div>
            <div className="shrink-0">
              <FillIndicator shift={liveShift} />
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {/* Assignment list */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Assigned ({assignments.filter((a) => a.status !== 'cancelled').length})
                </h4>
                {assignments.length === 0 ? (
                  <p className="text-sm text-gray-400">No volunteers assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.user_name}</p>
                          <p className="text-xs text-gray-400 truncate">{a.user_email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLES[a.status]}`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleUnassign(a)}
                            className="text-red-400 hover:text-red-600 text-xs transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign form */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Assign Volunteer
                </h4>
                <form onSubmit={handleAssign} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select volunteer…</option>
                      {available.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!selectedUserId || assigning}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full text-sm text-gray-500 hover:text-gray-800 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
