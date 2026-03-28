import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'
import { Building2, TrendingUp, Recycle, Leaf } from 'lucide-react'

const API = '/api'
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280', '#D97706', '#EF4444']

export default function Municipality() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/municipality/dashboard`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-blue-400">
      Loading municipality data...
    </div>
  )

  const byCategory = (data?.by_category || []).map(c => ({
    name: c._id,
    count: c.count,
    carbon: c.carbon_saved?.toFixed(2),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={28} className="text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Municipality Dashboard</h1>
      </div>
      <p className="text-slate-400">City-wide waste classification analytics</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Classified', value: data?.total_classified || 0,                    icon: <Recycle size={20} />,    color: 'text-emerald-400' },
          { label: 'Recycling Rate',   value: `${data?.recycling_rate || 0}%`,                 icon: <TrendingUp size={20} />, color: 'text-blue-400' },
          { label: 'CO₂ Saved (kg)',   value: (data?.carbon_saved || 0).toFixed(1),            icon: <Leaf size={20} />,       color: 'text-green-400' },
          { label: 'Categories',       value: byCategory.length,                               icon: <Building2 size={20} />,  color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Waste by Category (Count)</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCategory}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
        </div>

        <div className="card">
          <h2 className="text-white font-semibold mb-4">Category Distribution</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-white font-semibold mb-4">Carbon Saved by Category (kg)</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCategory}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
                <Bar dataKey="carbon" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* Category table */}
      {byCategory.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Detailed Breakdown</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Count</th>
                <th className="text-left py-2">CO₂ Saved (kg)</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((c, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-2 capitalize text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {c.name}
                  </td>
                  <td className="py-2 text-slate-300">{c.count}</td>
                  <td className="py-2 text-slate-300">{c.carbon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
