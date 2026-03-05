import { useState, useEffect } from 'react'
import { shiftsApi } from '../../api/shifts'

const EMPTY = {
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  volunteers_needed: 1,
  notes: '',
}

export default function ShiftModal({ seasonId, shift, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (shift) {
      setForm({
        title: shift.title,
        date: shift.date,
        start_time: shift.start_time.slice(0, 5),
        end_time: shift.end_time.slice(0, 5),
        location: shift.location ?? '',
        volunteers_needed: shift.volunteers_needed,
        notes: shift.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [shift])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        volunteers_needed: Number(form.volunteers_needed),
        location: form.location || null,
        notes: form.notes || null,
      }
      if (shift) {
        await shiftsApi.update(shift.id, payload)
      } else {
        await shiftsApi.create({ ...payload, season_id: seasonId })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">
          {shift ? 'Edit Shift' : 'New Shift'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Morning Patrol"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date + Volunteers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={set('date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volunteers Needed
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.volunteers_needed}
                onChange={set('volunteers_needed')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={set('start_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={set('end_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Main Lodge"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Role description, special instructions…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : shift ? 'Save Changes' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
