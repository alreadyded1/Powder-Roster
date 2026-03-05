import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SeasonProvider } from './context/SeasonContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Seasons from './pages/Seasons'
import PrivateRoute from './components/PrivateRoute'
import ManagerRoute from './components/ManagerRoute'

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SeasonProvider>
    </AuthProvider>
  )
}
