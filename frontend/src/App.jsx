import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import UserPortal from './pages/UserPortal'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import History from './pages/History'
import ParticleBackground from './components/ParticleBackground'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout wrapper for authenticated workspace views
function DashboardLayout({ kbStatus, fetchStatus, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        kbStatus={kbStatus}
        onHome={() => navigate('/')}
      />
      <div className="app-main">
        <Sidebar
          open={sidebarOpen}
          kbStatus={kbStatus}
          onStatusRefresh={fetchStatus}
        />
        <main className={`page-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [kbStatus, setKbStatus] = useState({ online: false, chunks: 0, sources: [] })
  const navigate = useNavigate()
  const location = useLocation()

  const fetchStatus = async () => {
    try {
      const r = await fetch('/api/status')
      const d = await r.json()
      if (d.ok) setKbStatus({ online: d.online, chunks: d.knowledge_base_chunks, sources: d.indexed_sources })
    } catch (_) {}
  }

  useEffect(() => {
    const isDashboard = ['/chat', '/analytics', '/history'].some(p => location.pathname.startsWith(p))
    if (isDashboard) {
      fetchStatus()
      const t = setInterval(fetchStatus, 15000)
      return () => clearInterval(t)
    }
  }, [location.pathname])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        background: '#020209'
      }}>
        <div className="spinner spinner-lg" />
        <div style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)', letterSpacing: 2, fontSize: '0.82rem' }}>
          VERIFYING SESSION...
        </div>
      </div>
    )
  }

  return (
    <>
      <ParticleBackground />
      <Routes>
        {/* Public Landing Page */}
        <Route
          path="/"
          element={
            <Landing
              user={user}
              onLaunch={() => navigate(user ? '/chat' : '/login')}
              onLogout={logout}
            />
          }
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/chat" replace /> : <Login />
          }
        />

        {/* Authenticated Workspace Routes */}
        <Route
          element={
            isAuthenticated ? (
              <DashboardLayout
                kbStatus={kbStatus}
                fetchStatus={fetchStatus}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/chat" element={<UserPortal />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/history" element={<History />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
