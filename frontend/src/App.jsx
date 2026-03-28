import { Routes, Route, NavLink } from 'react-router-dom'
import { Recycle, BarChart3, Building2 } from 'lucide-react'
import Scanner from './pages/Scanner'
import Dashboard from './pages/Dashboard'
import Municipality from './pages/Municipality'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-8">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl">
          <Recycle size={28} />
          <span>Eco-Label Vision</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            <Recycle size={16} /> Scanner
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            <BarChart3 size={16} /> My Dashboard
          </NavLink>
          <NavLink
            to="/municipality"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            <Building2 size={16} /> Municipality
          </NavLink>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Routes>
          <Route path="/"            element={<Scanner />} />
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/municipality" element={<Municipality />} />
        </Routes>
      </main>

      <footer className="text-center text-slate-500 text-sm py-4 border-t border-slate-800">
        ♻️ Eco-Label Vision — AI-Powered Smart Bin Assistant
      </footer>
    </div>
  )
}
