import { useState, useEffect, useRef, useCallback } from 'react'
import { notificationsApi } from '../api/notifications'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'

const POLL_INTERVAL = 30_000 // 30s

const TYPE_ICON = {
  assigned: '📋',
  unassigned: '❌',
  self_signed_up: '✅',
  self_withdrew: '↩️',
  shift_updated: '✏️',
}

export default function NotificationBell() {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'

  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('notifications') // 'notifications' | 'alerts'
  const panelRef = useRef(null)

  const fetchCount = useCallback(async () => {
    try {
      const count = await notificationsApi.count()
      setUnread(count)
    } catch {}
  }, [])

  // Poll unread count
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchCount])

  // Load full list when panel opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const tasks = [notificationsApi.list().then(setNotifications)]
    if (isManager && selectedSeason) {
      tasks.push(notificationsApi.alerts(selectedSeason.id).then(setAlerts))
    }
    Promise.all(tasks).finally(() => setLoading(false))
  }, [open, isManager, selectedSeason])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  const handleClear = async () => {
    await notificationsApi.clear()
    setNotifications((prev) => prev.filter((n) => !n.is_read))
    fetchCount()
  }

  const handleMarkOne = async (id) => {
    await notificationsApi.markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear read
              </button>
            </div>
          </div>

          {/* Tabs (manager only) */}
          {isManager && (
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab('notifications')}
                className={`flex-1 text-xs font-medium py-2 transition-colors ${
                  tab === 'notifications'
                    ? 'text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inbox {unread > 0 && <span className="ml-1 text-red-500">({unread})</span>}
              </button>
              <button
                onClick={() => setTab('alerts')}
                className={`flex-1 text-xs font-medium py-2 transition-colors ${
                  tab === 'alerts'
                    ? 'text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Alerts {alerts.length > 0 && <span className="ml-1 text-amber-500">({alerts.length})</span>}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : tab === 'notifications' ? (
              notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkOne(n.id)}
                      className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        n.is_read ? 'opacity-60' : 'bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              // Alerts tab
              alerts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No unfilled shifts in the next 7 days</p>
              ) : (
                <ul>
                  {alerts.map((a) => (
                    <li key={a.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">⚠️</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {a.date} &middot; {a.start_time.slice(0, 5)}
                            {a.location ? ` · ${a.location}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                a.assigned_count === 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {a.assigned_count}/{a.volunteers_needed} filled
                            </span>
                            <span className="text-xs text-gray-400">
                              {a.days_until === 0
                                ? 'Today'
                                : a.days_until === 1
                                ? 'Tomorrow'
                                : `In ${a.days_until} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
