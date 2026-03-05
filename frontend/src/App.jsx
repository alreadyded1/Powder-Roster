import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SeasonProvider } from './context/SeasonContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Seasons from './pages/Seasons'
import Shifts from './pages/Shifts'
import Schedule from './pages/Schedule'
import Roster from './pages/Roster'
import Users from './pages/Users'
import InviteAccept from './pages/InviteAccept'
import Profile from './pages/Profile'
import AuditLog from './pages/AuditLog'
import PrivateRoute from './components/PrivateRoute'
import ManagerRoute from './components/ManagerRoute'
import SuperAdminRoute from './components/SuperAdminRoute'

export default function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/seasons"
              element={
                <ManagerRoute>
                  <Seasons />
                </ManagerRoute>
              }
            />
            <Route
              path="/shifts"
              element={
                <ManagerRoute>
                  <Shifts />
                </ManagerRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <PrivateRoute>
                  <Schedule />
                </PrivateRoute>
              }
            />
            <Route
              path="/roster"
              element={
                <ManagerRoute>
                  <Roster />
                </ManagerRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ManagerRoute>
                  <Users />
                </ManagerRoute>
              }
            />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <SuperAdminRoute>
                  <AuditLog />
                </SuperAdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SeasonProvider>
    </AuthProvider>
  )
}
