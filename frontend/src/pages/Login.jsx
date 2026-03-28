import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Recycle, Eye, EyeOff, User, Building2, ArrowRight, Leaf, Shield, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeSwitcher from '../components/ThemeSwitcher'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: <Recycle size={20}/>,   text: 'AI-powered waste classification' },
  { icon: <Leaf size={20}/>,      text: 'Track your carbon footprint' },
  { icon: <BarChart3 size={20}/>, text: 'Gamified recycling rewards' },
  { icon: <Shield size={20}/>,    text: 'Municipality analytics dashboard' },
]

export default function Login() {
  const [mode,    setMode]    = useState('login')
  const [role,    setRole]    = useState('user')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({ username:'', email:'', password:'' })
  const { login, signup } = useAuth()
  const { theme } = useTheme()
  const navigate  = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password)
        toast.success(`Welcome back, ${user.username}! 🌱`)
        navigate(user.role === 'municipality' ? '/municipality' : '/')
      } else {
        if (!form.username.trim()) { toast.error('Username is required'); setLoading(false); return }
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
    <div className="min-h-screen flex" style={{ background: theme.bg }}>

      {/* ── LEFT PANEL — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12"
        style={{ background: `linear-gradient(145deg, ${theme.accent}22 0%, ${theme.bg} 60%)` }}
      >
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage:"url('/images/bg-login.jpg')" }} />

        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: theme.accent }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: theme.accent }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: theme.accent }}>
              <Recycle size={26} className="text-white" />
            </div>
            <div>
              <div className="font-black text-xl" style={{ color: theme.text }}>Eco-Label Vision</div>
              <div className="text-xs" style={{ color: theme.muted }}>AI Smart Bin Assistant</div>
            </div>
          </div>

          {/* Hero text */}
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
            <h1 className="text-5xl font-black leading-tight mb-4" style={{ color: theme.text }}>
              Sort smarter.<br/>
              <span style={{ color: theme.accent }}>Save the planet.</span>
            </h1>
            <p className="text-lg mb-10" style={{ color: theme.muted }}>
              AI-powered waste classification that turns recycling into a rewarding experience.
            </p>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: 0.2 + i*0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: theme.accent+'25', color: theme.accent }}>
                  {f.icon}
                </div>
                <span className="text-sm font-medium" style={{ color: theme.text }}>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8">
          {[['6','Waste Categories'],['95%','Model Accuracy'],['5','Themes']].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-black" style={{ color: theme.accent }}>{val}</div>
              <div className="text-xs" style={{ color: theme.muted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.accent }}>
              <Recycle size={18} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: theme.text }}>Eco-Label Vision</span>
          </div>
          <div className="lg:ml-auto">
            <ThemeSwitcher />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            className="w-full max-w-md"
          >
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-black" style={{ color: theme.text }}>
                {mode === 'login' ? 'Welcome back 👋' : 'Create account 🌱'}
              </h2>
              <p className="mt-1 text-sm" style={{ color: theme.muted }}>
                {mode === 'login'
                  ? 'Sign in to continue your eco journey'
                  : 'Join thousands of eco-conscious recyclers'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-2xl p-1 mb-6" style={{ background: theme.card, border:`1px solid ${theme.border}` }}>
              {['login','signup'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
                  style={mode===m
                    ? { background: theme.accent, color:'#fff', boxShadow:`0 2px 12px ${theme.accent}50` }
                    : { color: theme.muted }
                  }
                >{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
              ))}
            </div>

            {/* Role selector — signup only */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }} className="overflow-hidden mb-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.muted }}>
                    I am joining as
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key:'user',         label:'Citizen',     icon:<User size={22}/>,      desc:'Scan & earn rewards' },
                      { key:'municipality', label:'Municipality', icon:<Building2 size={22}/>, desc:'City-wide analytics' },
                    ].map(r => (
                      <button key={r.key} onClick={() => setRole(r.key)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
                        style={role===r.key
                          ? { borderColor: theme.accent, background: theme.accent+'18', color: theme.accent }
                          : { borderColor: theme.border, color: theme.muted, background: theme.card }
                        }
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: role===r.key ? theme.accent+'30' : theme.bg }}>
                          {r.icon}
                        </div>
                        <span className="font-bold text-sm">{r.label}</span>
                        <span className="text-xs opacity-70 text-center">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form fields */}
            <form onSubmit={submit} className="space-y-4">
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Username</label>
                    <input value={form.username} onChange={set('username')} placeholder="eco_hero_42"
                      className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-medium transition-all focus:ring-2"
                      style={{ background: theme.card, borderColor: theme.border, color: theme.text }}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Email address</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-medium transition-all"
                  style={{ background: theme.card, borderColor: theme.border, color: theme.text }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-medium pr-12 transition-all"
                    style={{ background: theme.card, borderColor: theme.border, color: theme.text }}
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPw(p=>!p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-50"
                    style={{ color: theme.muted }}
                  >
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit" disabled={loading}
                whileHover={!loading ? { scale:1.02 } : {}}
                whileTap={!loading ? { scale:0.98 } : {}}
                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 mt-2 transition-all"
                style={{
                  background: loading ? theme.muted : `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                  boxShadow: loading ? 'none' : `0 4px 20px ${theme.accent}50`
                }}
              >
                {loading
                  ? <span className="animate-spin text-xl">⟳</span>
                  : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18}/></>
                }
              </motion.button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-sm mt-6" style={{ color: theme.muted }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode==='login'?'signup':'login')}
                className="font-bold hover:underline" style={{ color: theme.accent }}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>

            <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
              By continuing you agree to our Terms of Service & Privacy Policy
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
