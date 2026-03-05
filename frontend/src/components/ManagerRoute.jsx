import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ManagerRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const isManager = user?.role === 'manager' || user?.role === 'super_admin'
  return isManager ? children : <Navigate to="/" replace />
}
