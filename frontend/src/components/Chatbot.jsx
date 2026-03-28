import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot } from 'lucide-react'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'

const SUGGESTIONS = [
  'Can I recycle a pizza box?',
  'How to dispose batteries?',
  'What is resin code 1?',
  'Is aluminium foil recyclable?',
]

export default function Chatbot() {
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState([
    { role:'bot', text:'Hi! I\'m EcoBot 🌱 Ask me anything about recycling and waste disposal!' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs, open])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMsgs(m => [...m, { role:'user', text: msg }])
    setLoading(true)
    try {
      const { data } = await axios.post('/api/chat', { message: msg })
      setMsgs(m => [...m, { role:'bot', text: data.reply }])
    } catch {
      setMsgs(m => [...m, { role:'bot', text:'Sorry, I\'m having trouble right now. Try again! ♻️' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center overflow-hidden border-2"
        style={{ background: theme.accent, borderColor: theme.accentHover }}
        aria-label="Open EcoBot"
      >
        {/* Use chatbot-avatar.png if placed in public/images/, else fallback icon */}
        <img
          src="/images/chatbot-avatar.png"
          alt="EcoBot"
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
        />
        <div className="hidden w-full h-full items-center justify-center">
          <Bot size={28} className="text-white" />
        </div>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:30, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:30, scale:0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
            style={{ background: theme.card, borderColor: theme.border, maxHeight:'70vh' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: theme.accent, borderColor: theme.border }}>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                <img src="/images/chatbot-avatar.png" alt="" className="w-full h-full object-cover"
                  onError={e => { e.target.style.display='none' }} />
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">EcoBot</div>
                <div className="text-white/70 text-xs">Powered by Groq AI ⚡</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
                <X size={18}/>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight:200 }}>
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed"
                    style={m.role==='user'
                      ? { background: theme.accent, color:'#fff', borderRadius:'18px 18px 4px 18px' }
                      : { background: theme.bg, color: theme.text, borderRadius:'18px 18px 18px 4px', border:`1px solid ${theme.border}` }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl text-sm" style={{ background: theme.bg, color: theme.muted, border:`1px solid ${theme.border}` }}>
                    <span className="animate-pulse">EcoBot is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {msgs.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-xs px-3 py-1 rounded-full border transition-all hover:opacity-80"
                    style={{ borderColor: theme.accent, color: theme.accent, background: theme.accent+'15' }}
                  >{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 p-3 border-t" style={{ borderColor: theme.border }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && send()}
                placeholder="Ask about recycling..."
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border"
                style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: theme.accent }}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
