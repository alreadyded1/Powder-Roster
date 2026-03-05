import { useState } from 'react'
import { shiftsApi } from '../../api/shifts'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const EMPTY = {
  title: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  location: '',
  volunteers_needed: 1,
  notes: '',
}

function countDates(start, end, days) {
  if (!start || !end || !days.length) return 0
  let count = 0
  let cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (cur <= endD) {
    if (days.includes(cur.getDay() === 0 ? 6 : cur.getDay() - 1)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function BulkShiftModal({ seasonId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [selectedDays, setSelectedDays] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleDay = (idx) =>
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
    )

  const preview = countDates(form.start_date, form.end_date, selectedDays)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedDays.length) {
      setError('Select at least one day of the week.')
      return
    }
    setSaving(true)
    try {
      await shiftsApi.bulkCreate({
        season_id: seasonId,
        title: form.title,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || null,
        volunteers_needed: Number(form.volunteers_needed),
        notes: form.notes || null,
        start_date: form.start_date,
        end_date: form.end_date,
        days_of_week: selectedDays,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Bulk create failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Bulk Create Shifts</h3>
        <p className="text-sm text-gray-500 mb-5">
          Repeat a shift pattern across a date range on selected days.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Afternoon Patrol"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={set('start_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={set('end_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedDays.includes(idx)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Role description, special instructions…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          {preview > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700">
              This will create <strong>{preview}</strong> shift{preview !== 1 ? 's' : ''}.
            </div>
          )}

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
              {saving ? 'Creating…' : `Create ${preview > 0 ? preview + ' ' : ''}Shift${preview !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
