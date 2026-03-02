import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, getAgeVerified, useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import AgeGate from './pages/AgeGate'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DashboardPartner from './pages/DashboardPartner'
import DashboardAdmin from './pages/DashboardAdmin'
import AdDetail from './pages/AdDetail'

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const verified = getAgeVerified()
  if (!verified) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const verified = getAgeVerified()
  if (!verified) return <Navigate to="/" replace />
  if (loading) return <p style={{ padding: '2rem', textAlign: 'center' }}>Ładowanie…</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingOrRedirect />} />
          <Route path="/age-gate" element={<AgeGate />} />
          <Route
            path="/home"
            element={
              <PublicOnlyRoute>
                <Home />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/partner"
            element={
              <RequireAuth>
                <DashboardPartner />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <DashboardAdmin />
              </RequireAuth>
            }
          />
          <Route
            path="/ad/:id"
            element={
              <PublicOnlyRoute>
                <AdDetail />
              </PublicOnlyRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function LandingOrRedirect() {
  const verified = getAgeVerified()
  if (verified) return <Navigate to="/home" replace />
  return <AgeGate />
}
