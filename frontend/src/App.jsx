import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Recycle, BarChart3, Building2, LogOut } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import ThemeSwitcher from './components/ThemeSwitcher'
import Chatbot from './components/Chatbot'
import Scanner from './pages/Scanner'
import Dashboard from './pages/Dashboard'
import Municipality from './pages/Municipality'
import Login from './pages/Login'

function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-64 text-2xl animate-pulse">♻️</div>
  if (!user) return <Navigate to="/login" replace />
  // Municipality users can only access /municipality
  if (user.role === 'municipality' && !requireRole) return <Navigate to="/municipality" replace />
  if (requireRole && user.role !== requireRole) return <Navigate to="/login" replace />
  return children
}

function Navbar() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const navItem = (to, icon, label, activeColor) => (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'text-white' : 'hover:text-white'}`
      }
      style={({ isActive }) => isActive
        ? { background: activeColor || theme.accent, color: '#fff', boxShadow: `0 2px 12px ${(activeColor || theme.accent)}40` }
        : { color: theme.muted }
      }
    >
      {icon}{label}
    </NavLink>
  )

  return (
    <nav className="sticky top-0 z-30 border-b"
      style={{ background: theme.nav + 'f5', borderColor: theme.navBorder, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 font-black text-lg mr-3 shrink-0"
          style={{ color: theme.accent }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`, boxShadow: `0 2px 12px ${theme.accent}50` }}>
            <Recycle size={18} className="text-white" />
          </div>
          <span className="hidden sm:inline gradient-text">Eco-Label</span>
        </button>

        {/* Nav links */}
        {user && user.role !== 'municipality' && (
          <div className="flex gap-1">
            {navItem('/', <Recycle size={14}/>, 'Scanner')}
            {navItem('/dashboard', <BarChart3 size={14}/>, 'Dashboard')}
          </div>
        )}
        {user && user.role === 'municipality' && (
          <div className="flex gap-1">
            {navItem('/municipality', <Building2 size={14}/>, 'Municipality', '#3B82F6')}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* User stats — only for regular users */}
          {user && user.role !== 'municipality' && (
            <div className="hidden md:flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                style={{ background: theme.card, color: '#FCD34D', border: `1px solid ${theme.border}` }}>
                🪙 {user.coins || 0}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                style={{ background: theme.card, color: theme.accent, border: `1px solid ${theme.border}` }}>
                ⚡ {user.xp || 0} XP
              </span>
              {(user.streak || 0) > 1 && (
                <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                  style={{ background: theme.card, color: '#F97316', border: `1px solid ${theme.border}` }}>
                  🔥 {user.streak}
                </span>
              )}
            </div>
          )}

          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold leading-tight" style={{ color: theme.text }}>{user.username}</span>
                <span className="text-xs capitalize px-1.5 py-0.5 rounded-md leading-tight"
                  style={{
                    background: user.role === 'municipality' ? '#3B82F620' : theme.accent + '20',
                    color: user.role === 'municipality' ? '#3B82F6' : theme.accent,
                    fontSize: 10,
                  }}>
                  {user.role}
                </span>
              </div>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#EF444418', color: '#EF4444', border: '1px solid #EF444430' }}
              >
                <LogOut size={14} /><span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`, boxShadow: `0 2px 12px ${theme.accent}40` }}
            >Sign In</NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg, color: theme.text }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }
      }}/>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/municipality" element={<ProtectedRoute requireRole="municipality"><Municipality /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs py-3 border-t" style={{ borderColor: theme.border, color: theme.muted }}>
        ♻️ Eco-Label Vision v2.0 — AI-Powered Smart Bin Assistant
      </footer>
      <Chatbot />
    </div>
  )
}
