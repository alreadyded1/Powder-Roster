import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SeasonSelector from './SeasonSelector'
import NotificationBell from './NotificationBell'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', roles: ['super_admin', 'manager', 'volunteer'] },
  { to: '/schedule', label: 'My Schedule', roles: ['super_admin', 'manager', 'volunteer'] },
  { to: '/seasons', label: 'Seasons', roles: ['super_admin', 'manager'] },
  { to: '/shifts', label: 'Shifts', roles: ['super_admin', 'manager'] },
  { to: '/roster', label: 'Roster', roles: ['super_admin', 'manager'] },
  { to: '/users', label: 'Users', roles: ['super_admin', 'manager'] },
  { to: '/audit', label: 'Audit Log', roles: ['super_admin'] },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role?.replace(/_/g, ' ')
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user?.role))

  const linkClass = (to) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === to
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            {/* Left: brand + desktop nav links */}
            <div className="flex items-center gap-6">
              <span className="text-xl font-bold text-blue-700 tracking-tight whitespace-nowrap">
                Powder Roster
              </span>
              <div className="hidden sm:flex items-center gap-1">
                {visibleLinks.map((link) => (
                  <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: season selector + bell + user info */}
            <div className="flex items-center gap-3">
              {isManager && <SeasonSelector />}
              <NotificationBell />
              <Link
                to="/profile"
                className="hidden md:block text-sm text-gray-700 hover:text-blue-700 transition-colors font-medium"
              >
                {user?.name}
              </Link>
              <span className="hidden md:inline text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize font-medium whitespace-nowrap">
                {roleLabel}
              </span>
              <button
                onClick={handleLogout}
                className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
            <div className="pt-2 border-t border-gray-100">
              <div className="px-3 py-1 text-xs text-gray-400 capitalize">{user?.name} · {roleLabel}</div>
              <button
                onClick={() => { setMobileOpen(false); handleLogout() }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
