import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { usersApi, invitesApi } from '../api/users'

const ROLE_OPTIONS_MANAGER = ['volunteer', 'manager']
const ROLE_OPTIONS_SUPER = ['volunteer', 'manager', 'super_admin']

const ROLE_BADGE = {
  volunteer: 'bg-gray-100 text-gray-600',
  manager: 'bg-blue-100 text-blue-700',
  super_admin: 'bg-purple-100 text-purple-700',
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({ user, currentUserRole, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const roleOptions = currentUserRole === 'super_admin' ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_MANAGER

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await usersApi.update(user.id, form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
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
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Invite Modal ───────────────────────────────────────────────────────────────
function InviteModal({ currentUserRole, onClose, onSent }) {
  const [form, setForm] = useState({ email: '', role: 'volunteer' })
  const [inviteResult, setInviteResult] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const roleOptions = currentUserRole === 'super_admin' ? ROLE_OPTIONS_SUPER : ROLE_OPTIONS_MANAGER

  const signupUrl = inviteResult
    ? `${window.location.origin}/invite/${inviteResult.token}`
    : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const result = await invitesApi.create(form)
      setInviteResult(result)
      onSent()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create invite.')
    } finally {
      setSending(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(signupUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {!inviteResult ? (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Invite User</h3>
            <p className="text-sm text-gray-500 mb-5">
              A signup link will be generated. Share it with the invitee.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="volunteer@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
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
                  disabled={sending}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Creating…' : 'Generate Invite Link'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 text-lg">✓</span>
              <h3 className="text-lg font-bold text-gray-900">Invite Created</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Share this link with <strong>{inviteResult.email}</strong>. It expires in 7 days.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs text-gray-500 break-all font-mono">{signupUrl}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCopy}
                className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Deactivate Confirm ─────────────────────────────────────────────────────────
function DeactivateConfirm({ user, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h4 className="text-base font-bold text-gray-900 mb-2">Deactivate account?</h4>
        <p className="text-sm text-gray-600 mb-5">
          <strong>{user.name}</strong> will be unable to log in. Their shift history is preserved.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await usersApi.list())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      if (!showInactive && !u.is_active) return false
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    })
  }, [users, search, showInactive])

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      await usersApi.deactivate(deactivateTarget.id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Deactivate failed.')
    } finally {
      setDeactivateTarget(null)
    }
  }

  const handleReactivate = async (u) => {
    try {
      await usersApi.reactivate(u.id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Reactivate failed.')
    }
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage accounts and send invite links.
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Invite User
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="flex-1 min-w-[220px] max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show inactive
          </label>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors hover:bg-gray-50 ${!u.is_active ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditTarget(u)}
                          className="text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Edit
                        </button>
                        {u.id !== currentUser?.id && (
                          <>
                            {u.is_active ? (
                              <button
                                onClick={() => setDeactivateTarget(u)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivate(u)}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <p className="text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
            {!showInactive && users.some((u) => !u.is_active) && (
              <> · <button onClick={() => setShowInactive(true)} className="underline hover:text-gray-600">show inactive</button></>
            )}
          </p>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          user={editTarget}
          currentUserRole={currentUser?.role}
          onClose={() => setEditTarget(null)}
          onSaved={async () => { setEditTarget(null); await load() }}
        />
      )}
      {deactivateTarget && (
        <DeactivateConfirm
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivate}
        />
      )}
      {inviteOpen && (
        <InviteModal
          currentUserRole={currentUser?.role}
          onClose={() => setInviteOpen(false)}
          onSent={load}
        />
      )}
    </Layout>
  )
}
