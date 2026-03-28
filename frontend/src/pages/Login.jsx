import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Recycle, Eye, EyeOff, User, Building2, Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [role,     setRole]     = useState('user')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [form,     setForm]     = useState({ username:'', email:'', password:'' })
  const { login, signup } = useAuth()
  const { theme } = useTheme()
  const navigate  = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password)
        toast.success(`Welcome back, ${user.username}! 🌱`)
        navigate(user.role === 'municipality' ? '/municipality' : '/')
      } else {
        if (!form.username.trim()) { toast.error('Username required'); return }
        const user = await signup(form.username, form.email, form.password, role)
        toast.success(`Account created! Welcome, ${user.username} 🎉`)
        navigate(user.role === 'municipality' ? '/municipality' : '/')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Background image — place bg-login.jpg in frontend/public/images/ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: "url('/images/bg-login.jpg')" }}
      />
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: theme.accent }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: theme.accent }} />
      </div>

      <motion.div
        initial={{ opacity:0, y:30 }}
        animate={{ opacity:1, y:0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: theme.accent }}>
            <Recycle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: theme.text }}>Eco-Label Vision</h1>
          <p className="mt-1" style={{ color: theme.muted }}>AI-Powered Smart Bin Assistant</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl border" style={{ background: theme.card, borderColor: theme.border }}>
          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: theme.bg }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={mode===m ? { background: theme.accent, color:'#fff' } : { color: theme.muted }}
              >{m}</button>
            ))}
          </div>

          {/* Role selector (signup only) */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mb-5 overflow-hidden">
                <p className="text-sm mb-2 font-medium" style={{ color: theme.muted }}>I am a...</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key:'user',         label:'Citizen',      icon:<User size={18}/>,      desc:'Scan & sort waste' },
                    { key:'municipality', label:'Municipality',  icon:<Building2 size={18}/>, desc:'City analytics' },
                  ].map(r => (
                    <button key={r.key} onClick={() => setRole(r.key)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm"
                      style={role===r.key
                        ? { borderColor: theme.accent, background: theme.accent+'22', color: theme.accent }
                        : { borderColor: theme.border, color: theme.muted }
                      }
                    >
                      {r.icon}
                      <span className="font-semibold">{r.label}</span>
                      <span className="text-xs opacity-70">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: theme.muted }}>Username</label>
                <input value={form.username} onChange={set('username')} placeholder="eco_hero_42"
                  className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm"
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: theme.muted }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm"
                style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: theme.muted }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm pr-12"
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                  style={{ color: theme.muted }}
                >
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all mt-2 flex items-center justify-center gap-2"
              style={{ background: loading ? theme.muted : theme.accent }}
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <><Leaf size={18}/> {mode === 'login' ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: theme.muted }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode==='login'?'signup':'login')}
              className="font-semibold hover:underline" style={{ color: theme.accent }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
