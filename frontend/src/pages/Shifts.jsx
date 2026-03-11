import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'
import { shiftsApi } from '../api/shifts'
import ShiftModal from '../components/shifts/ShiftModal'
import BulkShiftModal from '../components/shifts/BulkShiftModal'
import AssignmentsModal from '../components/shifts/AssignmentsModal'
import ListView from '../components/shifts/ListView'
import CalendarView from '../components/shifts/CalendarView'

export default function Shifts() {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [shiftModal, setShiftModal] = useState(null) // null | 'new' | shift object
  const [bulkModal, setBulkModal] = useState(false)
  const [assignShift, setAssignShift] = useState(null) // shift to manage assignments for

  const loadShifts = useCallback(async () => {
    if (!selectedSeason) return
    setLoading(true)
    setError('')
    try {
      const data = await shiftsApi.list(selectedSeason.id)
      setShifts(data)
    } catch {
      setError('Failed to load shifts.')
    } finally {
      setLoading(false)
    }
  }, [selectedSeason])

  useEffect(() => {
    loadShifts()
  }, [loadShifts])

  const handleDelete = async (shift) => {
    try {
      await shiftsApi.delete(shift.id)
      await loadShifts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed.')
    }
  }

  const handleSaved = async () => {
    setShiftModal(null)
    setBulkModal(false)
    await loadShifts()
  }

  const openEdit = (shift) => setShiftModal(shift)
  const openAssign = (shift) => setAssignShift(shift)

  if (!selectedSeason) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium text-gray-500">No season selected</p>
          <p className="text-sm mt-1">Create a season first, then come back to manage shifts.</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Shifts</h2>
            <p className="text-sm text-gray-500 mt-0.5">{selectedSeason.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              {['list', 'calendar'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v === 'list' ? '☰ List' : '⊞ Calendar'}
                </button>
              ))}
            </div>
            {isManager && (
              <>
                <button
                  onClick={() => setBulkModal(true)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bulk Create
                </button>
                <button
                  onClick={() => setShiftModal('new')}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + New Shift
                </button>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Open
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Partially filled
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Full
          </span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500 text-sm">{error}</div>
          ) : view === 'list' ? (
            <ListView shifts={shifts} onEdit={openEdit} onDelete={handleDelete} onAssign={openAssign} readOnly={!isManager} />
          ) : (
            <div className="p-4">
              <CalendarView shifts={shifts} onEdit={openEdit} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {shiftModal && (
        <ShiftModal
          seasonId={selectedSeason.id}
          shift={shiftModal === 'new' ? null : shiftModal}
          onClose={() => setShiftModal(null)}
          onSaved={handleSaved}
        />
      )}
      {bulkModal && (
        <BulkShiftModal
          seasonId={selectedSeason.id}
          onClose={() => setBulkModal(false)}
          onSaved={handleSaved}
        />
      )}
      {assignShift && (
        <AssignmentsModal
          shift={assignShift}
          onClose={() => setAssignShift(null)}
          onChanged={loadShifts}
        />
      )}
    </Layout>
  )
}
