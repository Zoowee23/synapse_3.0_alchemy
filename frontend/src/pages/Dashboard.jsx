import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts'
import { Leaf, Trophy, TrendingUp, Recycle } from 'lucide-react'

const API = '/api'
const USER_ID = 'user_demo'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280', '#D97706', '#EF4444']

const BADGE_ICONS = { beginner: '🌱', warrior: '♻️', champion: '🏆', zero_waste: '🌍' }

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/stats/${USER_ID}`),
      axios.get(`${API}/history/${USER_ID}?limit=100`),
    ]).then(([s, h]) => {
      setStats(s.data)
      setHistory(h.data.history || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-emerald-400">
      Loading dashboard...
    </div>
  )

  // Build chart data from history
  const categoryCount = {}
  history.forEach(h => {
    categoryCount[h.prediction] = (categoryCount[h.prediction] || 0) + 1
  })
  const pieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }))

  const recyclableData = [
    { name: 'Recyclable',     value: stats?.recyclable_count || 0 },
    { name: 'Non-Recyclable', value: (stats?.total || 0) - (stats?.recyclable_count || 0) },
  ]

  // Carbon over time (last 10 entries)
  const carbonLine = history.slice(0, 10).reverse().map((h, i) => ({
    day: `#${i + 1}`,
    carbon: h.carbon_saved,
  }))

  const nextBadge = [
    { id: 'beginner', threshold: 10 },
    { id: 'warrior',  threshold: 50 },
    { id: 'champion', threshold: 100 },
    { id: 'zero_waste', threshold: 200 },
  ].find(b => (stats?.total || 0) < b.threshold)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">My Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans',    value: stats?.total || 0,                    icon: <Recycle size={20} />,    color: 'text-emerald-400' },
          { label: 'Recycled',       value: stats?.recyclable_count || 0,          icon: <TrendingUp size={20} />, color: 'text-blue-400' },
          { label: 'CO₂ Saved (kg)', value: (stats?.carbon_saved || 0).toFixed(2), icon: <Leaf size={20} />,       color: 'text-green-400' },
          { label: 'Badges',         value: stats?.badges?.length || 0,            icon: <Trophy size={20} />,     color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {stats?.badges?.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">🏅 Earned Badges</h2>
          <div className="flex flex-wrap gap-3">
            {stats.badges.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                <span className="text-2xl">{b.icon}</span>
                <span className="text-yellow-300 font-medium text-sm">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress to next badge */}
      {nextBadge && (
        <div className="card">
          <h2 className="text-white font-semibold mb-3">Progress to Next Badge</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{stats?.total || 0} / {nextBadge.threshold} scans</span>
            <span className="text-emerald-400">{BADGE_ICONS[nextBadge.id]} {nextBadge.id}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((stats?.total || 0) / nextBadge.threshold) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Waste by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
        </div>

        <div className="card">
          <h2 className="text-white font-semibold mb-4">Recyclable vs Non-Recyclable</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={recyclableData}>
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
              <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-white font-semibold mb-4">Carbon Saved Over Time</h2>
          {carbonLine.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={carbonLine}>
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
                <Line type="monotone" dataKey="carbon" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Recent History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">Confidence</th>
                  <th className="text-left py-2">Recyclable</th>
                  <th className="text-left py-2">CO₂ Saved</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((h, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-700/30">
                    <td className="py-2 capitalize text-white">{h.prediction}</td>
                    <td className="py-2 text-slate-300">{(h.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${h.recyclable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {h.recyclable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300">{h.carbon_saved} kg</td>
                    <td className="py-2 text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
