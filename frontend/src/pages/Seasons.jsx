import { useState } from 'react'
import Layout from '../components/Layout'
import SeasonBadge, { getSeasonStatus } from '../components/SeasonBadge'
import { useSeason } from '../context/SeasonContext'
import { seasonsApi } from '../api/seasons'

const EMPTY_FORM = { name: '', start_date: '', end_date: '' }

export default function Seasons() {
  const { seasons, loadSeasons } = useSeason()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // season object or null
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (season) => {
    setEditing(season)
    setForm({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editing) {
        await seasonsApi.update(editing.id, form)
      } else {
        await seasonsApi.create(form)
      }
      await loadSeasons()
      setModalOpen(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (season) => {
    try {
      await seasonsApi.activate(season.id)
      await loadSeasons()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to activate season.')
    }
  }

  const handleDeactivate = async (season) => {
    try {
      await seasonsApi.deactivate(season.id)
      await loadSeasons()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate season.')
    }
  }

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seasons</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage roster seasons. Only one season can be active at a time.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Season
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {seasons.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No seasons yet. Create your first season to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Start</th>
                  <th className="px-6 py-3 font-medium text-gray-500">End</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">
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
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {season.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(season.start_date)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(season.end_date)}
                      </td>
                      <td className="px-6 py-4">
                        <SeasonBadge season={season} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(season)}
                            className="text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          {!isPast && (
                            <>
                              {season.is_active ? (
                                <button
                                  onClick={() => handleDeactivate(season)}
                                  className="text-yellow-600 hover:text-yellow-800 transition-colors"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(season)}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                >
                                  Activate
                                </button>
                              )}
                            </>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editing ? 'Edit Season' : 'New Season'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 2025-26 Season"
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
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
      )}
    </Layout>
  )
}
