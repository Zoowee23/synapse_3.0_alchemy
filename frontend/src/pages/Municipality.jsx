import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

const COLORS = ['#10B981','#3B82F6','#F59E0B','#6B7280','#D97706','#EF4444']

export default function Municipality() {
  const [data,    setData]    = useState(null)
  const [users,   setUsers]   = useState([])
  const [tab,     setTab]     = useState('overview')  // 'overview' | 'users'
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    Promise.all([
      axios.get('/api/municipality/dashboard'),
      axios.get('/api/municipality/users'),
    ]).then(([d, u]) => {
      setData(d.data)
      setUsers(u.data.users || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-4xl animate-pulse">🏙️</div>
  )

  const byCategory = (data?.by_category || []).map(c => ({
    name: c._id, count: c.count, carbon: parseFloat((c.carbon_saved || 0).toFixed(2)),
  }))

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center opacity-5 pointer-events-none"
        style={{ backgroundImage: "url('/images/bg-municipality.jpg')" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: theme.text }}>
            🏙️ Municipality Dashboard
          </h1>
          <p style={{ color: theme.muted }}>City-wide waste classification analytics</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'users',    label: '👥 All Users' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.key
                ? { background: '#3B82F6', color: '#fff' }
                : { background: theme.card, color: theme.muted, border: `1px solid ${theme.border}` }
              }
            >{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Classified', value: data?.total_classified || 0,                   icon: '📊', color: '#10B981' },
                { label: 'Recycling Rate',   value: `${data?.recycling_rate || 0}%`,                icon: '♻️', color: '#3B82F6' },
                { label: 'CO₂ Saved (kg)',   value: (data?.carbon_saved || 0).toFixed(1),           icon: '🌿', color: '#22C55E' },
                { label: 'Citizen Users',    value: data?.total_users || 0,                         icon: '👥', color: '#F59E0B' },
              ].map(s => (
                <motion.div key={s.label} whileHover={{ scale: 1.03 }}
                  className="rounded-2xl p-5 border text-center"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: theme.muted }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6 border" style={{ background: theme.card, borderColor: theme.border }}>
                <h2 className="font-bold mb-4" style={{ color: theme.text }}>Waste by Category</h2>
                {byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byCategory}>
                      <XAxis dataKey="name" tick={{ fill: theme.muted, fontSize: 11 }} />
                      <YAxis tick={{ fill: theme.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8" style={{ color: theme.muted }}>No data yet</p>}
              </div>

              <div className="rounded-2xl p-6 border" style={{ background: theme.card, borderColor: theme.border }}>
                <h2 className="font-bold mb-4" style={{ color: theme.text }}>Distribution</h2>
                {byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8" style={{ color: theme.muted }}>No data yet</p>}
              </div>
            </div>

            {/* Top recyclers */}
            {data?.top_users?.length > 0 && (
              <div className="rounded-2xl p-6 border" style={{ background: theme.card, borderColor: theme.border }}>
                <h2 className="font-bold mb-4" style={{ color: theme.text }}>🏆 Top Recyclers</h2>
                <div className="space-y-3">
                  {data.top_users.map((u, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                      style={{ background: theme.bg }}>
                      <span className="text-2xl">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <span className="font-semibold flex-1" style={{ color: theme.text }}>{u.username}</span>
                      <span className="text-sm" style={{ color: theme.muted }}>{u.scans} scans</span>
                      <span className="text-sm font-medium" style={{ color: '#10B981' }}>{u.carbon} kg CO₂</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'users' && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: theme.card, borderColor: theme.border }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: theme.border }}>
              <h2 className="font-bold" style={{ color: theme.text }}>
                👥 All Citizen Users ({users.length})
              </h2>
              <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                Complete user activity and recycling stats
              </p>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12" style={{ color: theme.muted }}>
                No citizen users registered yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: theme.border, background: theme.bg }}>
                      {['#','Username','Email','Total Scans','Recycled','CO₂ Saved','XP','Coins','Streak','Joined'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                          style={{ color: theme.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}
                        className="border-b transition-colors hover:opacity-80"
                        style={{ borderColor: theme.border }}
                      >
                        <td className="px-4 py-3" style={{ color: theme.muted }}>{i + 1}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: theme.text }}>{u.username}</td>
                        <td className="px-4 py-3" style={{ color: theme.muted }}>{u.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold" style={{ color: theme.accent }}>{u.total_scans || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: '#10B98120', color: '#10B981' }}>
                            {u.recyclable_scans || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: '#10B981' }}>
                          {u.carbon_saved || 0} kg
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: '#60A5FA' }}>
                          ⚡ {u.xp || 0}
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: '#FCD34D' }}>
                          🪙 {u.coins || 0}
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: '#F97316' }}>
                          {(u.streak || 0) > 0 ? `🔥 ${u.streak}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: theme.muted }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
