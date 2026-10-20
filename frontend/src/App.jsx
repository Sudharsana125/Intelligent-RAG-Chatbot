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

// Layout wrapper for authenticated workspace views
function DashboardLayout({ user, onLogout, kbStatus, fetchStatus, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        kbStatus={kbStatus}
        onHome={() => navigate('/')}
        user={user}
        onLogout={onLogout}
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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
      return saved ? JSON.parse(saved) : null
    } catch (_) {
      return null
    }
  })
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
    // Validate session token with server on initial mount
    if (user && user.token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) {
          handleLogout()
        }
      })
      .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const isDashboard = ['/chat', '/analytics', '/history'].some(p => location.pathname.startsWith(p))
    if (isDashboard) {
      fetchStatus()
      const t = setInterval(fetchStatus, 15000)
      return () => clearInterval(t)
    }
  }, [location.pathname])

  const handleLogin = (userData, remember = true) => {
    setUser(userData)
    try {
      if (remember) {
        localStorage.setItem('auth_user', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('auth_user', JSON.stringify(userData))
      }
    } catch (_) {}
  }

  const handleLogout = () => {
    const token = user?.token
    setUser(null)
    try {
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_user')
    } catch (_) {}

    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})
    }

    navigate('/login')
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
              onLogout={handleLogout}
            />
          }
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />
          }
        />

        {/* Authenticated Workspace Routes */}
        <Route
          element={
            user ? (
              <DashboardLayout
                user={user}
                onLogout={handleLogout}
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
      <AppContent />
    </BrowserRouter>
  )
}
