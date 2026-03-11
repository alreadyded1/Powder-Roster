import { useState } from 'react'
import Layout from '../components/Layout'
import SeasonBadge, { getSeasonStatus } from '../components/SeasonBadge'
import { useSeason } from '../context/SeasonContext'
import { seasonsApi } from '../api/seasons'

const EMPTY_FORM = { name: '', start_date: '', end_date: '', self_signup: false }

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseDetail(err) {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.message || 'Something went wrong.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ')
  return JSON.stringify(detail)
}

// ── Season Modal ───────────────────────────────────────────────────────────────
function SeasonModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          start_date: editing.start_date,
          end_date: editing.end_date,
          self_signup: editing.self_signup ?? false,
        }
      : EMPTY_FORM
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editing) {
        await seasonsApi.update(editing.id, form)
      } else {
        await seasonsApi.create(form)
      }
      onSaved()
    } catch (err) {
      setError(parseDetail(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">
          {editing ? 'Edit Season' : 'New Season'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2025–26 Season"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Self-signup toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.self_signup}
                onChange={(e) => setForm({ ...form, self_signup: e.target.checked })}
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  form.self_signup ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.self_signup ? 'translate-x-4' : ''
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Allow volunteer self-signup</p>
              <p className="text-xs text-gray-400">
                Volunteers can claim their own shifts
              </p>
            </div>
          </label>

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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Seasons() {
  const { seasons, loadSeasons, loading } = useSeason()
  const [modalTarget, setModalTarget] = useState(undefined) // undefined = closed, null = new, season = edit
  const [actionError, setActionError] = useState('')

  const handleSaved = async () => {
    setModalTarget(undefined)
    await loadSeasons()
  }

  const handleActivate = async (season) => {
    setActionError('')
    try {
      await seasonsApi.activate(season.id)
      await loadSeasons()
    } catch (err) {
      setActionError(parseDetail(err))
    }
  }

  const handleDeactivate = async (season) => {
    setActionError('')
    try {
      await seasonsApi.deactivate(season.id)
      await loadSeasons()
    } catch (err) {
      setActionError(parseDetail(err))
    }
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seasons</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage roster seasons. Only one season can be active at a time.
            </p>
          </div>
          <button
            onClick={() => setModalTarget(null)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Season
          </button>
        </div>

        {actionError && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {actionError}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No seasons yet. Create your first season to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Start
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    End
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Self-Signup
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {seasons.map((season) => {
                  const status = getSeasonStatus(season)
                  const isPast = status === 'past'
                  return (
                    <tr key={season.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {season.name}
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                        {formatDate(season.start_date)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                        {formatDate(season.end_date)}
                      </td>
                      <td className="px-5 py-4">
                        <SeasonBadge season={season} />
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {season.self_signup ? (
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                            On
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Off</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setModalTarget(season)}
                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          {!isPast && (
                            season.is_active ? (
                              <button
                                onClick={() => handleDeactivate(season)}
                                className="text-sm text-yellow-600 hover:text-yellow-800 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(season)}
                                className="text-sm text-green-600 hover:text-green-800 transition-colors"
                              >
                                Activate
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalTarget !== undefined && (
        <SeasonModal
          editing={modalTarget}
          onClose={() => setModalTarget(undefined)}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  )
}
