import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { profileApi } from '../api/profile'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    if (!name.trim()) return
    setNameLoading(true)
    try {
      await profileApi.update({ name: name.trim() })
      await refreshUser()
      setNameSuccess(true)
    } catch (err) {
      setNameError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setNameLoading(false)
    }
  }

  const handlePwSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pw.next !== pw.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    if (pw.next.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    setPwLoading(true)
    try {
      await profileApi.changePassword({ current_password: pw.current, new_password: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      setPwSuccess(true)
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setPwLoading(false)
    }
  }

  const roleLabel = user?.role?.replace(/_/g, ' ')

  return (
    <Layout>
      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Role:</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize font-medium">
            {roleLabel}
          </span>
        </div>

        {/* Update name */}
        <Section title="Display Name">
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setNameSuccess(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {nameError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{nameError}</p>
            )}
            {nameSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Name updated successfully.</p>
            )}
            <button
              type="submit"
              disabled={nameLoading || name.trim() === user?.name}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {nameLoading ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </Section>

        {/* Change password */}
        <Section title="Change Password">
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                placeholder="At least 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {pwError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Password changed successfully.</p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pwLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </Section>
      </div>
    </Layout>
  )
}
