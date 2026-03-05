import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SeasonSelector from './SeasonSelector'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', roles: ['super_admin', 'manager', 'volunteer'] },
  { to: '/seasons', label: 'Seasons', roles: ['super_admin', 'manager'] },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role?.replace(/_/g, ' ')
  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user?.role))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            {/* Left: brand + nav links */}
            <div className="flex items-center gap-6">
              <span className="text-xl font-bold text-blue-700 tracking-tight whitespace-nowrap">
                Powder Roster
              </span>
              <div className="hidden sm:flex items-center gap-1">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: season selector + user info */}
            <div className="flex items-center gap-4">
              {isManager && <SeasonSelector />}
              <span className="text-sm text-gray-700 hidden md:block">{user?.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize font-medium whitespace-nowrap">
                {roleLabel}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
