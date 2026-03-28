import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Waste items with Unsplash images, correct bin, and hints
const WASTE_ITEMS = [
  {
    id: 1, name: 'Plastic Bottle', category: 'plastic',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    correctBin: 'blue',
    hints: ['Check the bottom for a resin code (1-7)', 'Rinse it out before recycling', 'Remove the cap — it may go separately'],
  },
  {
    id: 2, name: 'Glass Bottle', category: 'glass',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
    correctBin: 'green',
    hints: ['Glass goes in a separate bank, not the blue bin', 'Remove metal lids first', 'Never mix with ceramics or Pyrex'],
  },
  {
    id: 3, name: 'Cardboard Box', category: 'cardboard',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&q=80',
    correctBin: 'blue',
    hints: ['Break it down flat before recycling', 'Remove tape and staples if possible', 'Wet cardboard cannot be recycled'],
  },
  {
    id: 4, name: 'Aluminium Can', category: 'metal',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&q=80',
    correctBin: 'blue',
    hints: ['Rinse out any remaining liquid', 'Crush it to save space', 'Metal is infinitely recyclable'],
  },
  {
    id: 5, name: 'Newspaper', category: 'paper',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80',
    correctBin: 'blue',
    hints: ['Keep paper dry — wet paper cannot be recycled', 'No need to remove staples', 'Paper can be recycled up to 7 times'],
  },
  {
    id: 6, name: 'Food Waste / Banana Peel', category: 'trash',
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80',
    correctBin: 'black',
    hints: ['Food waste goes in general waste or compost', 'Not suitable for blue recycling bin', 'Consider a home compost bin instead'],
  },
  {
    id: 7, name: 'Plastic Bag', category: 'trash',
    image: 'https://images.unsplash.com/photo-1591193686104-fddba4f8e5a4?w=400&q=80',
    correctBin: 'black',
    hints: ['Soft plastics are NOT recyclable in standard bins', 'Many supermarkets have soft plastic collection points', 'Reuse bags as many times as possible'],
  },
  {
    id: 8, name: 'Wine Bottle', category: 'glass',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
    correctBin: 'green',
    hints: ['Glass bottles go in the green glass bank', 'Rinse before recycling', 'Sort by colour if your area requires it'],
  },
  {
    id: 9, name: 'Tin Can', category: 'metal',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    correctBin: 'blue',
    hints: ['Steel and aluminium cans both go in the blue bin', 'Remove paper labels if possible', 'Rinse out food residue'],
  },
  {
    id: 10, name: 'Pizza Box (greasy)', category: 'trash',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    correctBin: 'black',
    hints: ['Grease contaminates paper recycling', 'Tear off any clean parts for the blue bin', 'The greasy part goes in general waste'],
  },
]

const BINS = [
  { id: 'blue',  label: 'Blue Bin',  desc: 'Paper, Plastic, Metal, Cardboard', bg: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', border: '#3B82F6', glow: 'rgba(59,130,246,0.4)' },
  { id: 'green', label: 'Green Bin', desc: 'Glass bottles & jars',              bg: 'linear-gradient(135deg,#064e3b,#059669)', border: '#10B981', glow: 'rgba(16,185,129,0.4)' },
  { id: 'black', label: 'Black Bin', desc: 'General / Non-recyclable waste',    bg: 'linear-gradient(135deg,#111827,#374151)', border: '#6B7280', glow: 'rgba(107,114,128,0.4)' },
]

function getRandomItem(exclude) {
  const pool = WASTE_ITEMS.filter(i => i.id !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function BinGame() {
  const [item,       setItem]       = useState(() => WASTE_ITEMS[Math.floor(Math.random() * WASTE_ITEMS.length)])
  const [chosen,     setChosen]     = useState(null)
  const [result,     setResult]     = useState(null)   // 'correct' | 'wrong'
  const [gamePoints, setGamePoints] = useState(0)
  const [hintsOpen,  setHintsOpen]  = useState(false)
  const [feedback,   setFeedback]   = useState(null)
  const { theme } = useTheme()

  const handleBin = (binId) => {
    if (result === 'correct') return
    setChosen(binId)
    if (binId === item.correctBin) {
      setResult('correct')
      setGamePoints(p => p + 10)
      setFeedback('Correct! Well done!')
    } else {
      setResult('wrong')
      setFeedback('Not quite — try again!')
      setTimeout(() => { setChosen(null); setResult(null); setFeedback(null) }, 1400)
    }
  }

  const nextItem = () => {
    setItem(getRandomItem(item.id))
    setChosen(null); setResult(null); setFeedback(null); setHintsOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>Bin Guessing Game</h2>
          <p className="text-sm" style={{ color: theme.muted }}>Which bin does this item belong in?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-xl border" style={{ background: theme.card, borderColor: theme.border }}>
            <div className="text-xl font-black" style={{ color: '#FCD34D' }}>+{gamePoints}</div>
            <div className="text-xs" style={{ color: theme.muted }}>game pts</div>
          </div>
          <button onClick={nextItem}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: theme.accent, color: '#fff' }}
          >
            <RefreshCw size={14} /> New Item
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: waste item image */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border relative" style={{ borderColor: theme.border }}>
            <img
              src={item.image}
              alt={item.name}
              className="w-full object-cover"
              style={{ height: 220 }}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' }}
            />
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
              <p className="text-white font-bold text-lg">{item.name}</p>
              <p className="text-white/60 text-xs capitalize">{item.category}</p>
            </div>
          </div>

          {/* Hints accordion */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border }}>
            <button
              onClick={() => setHintsOpen(h => !h)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all"
              style={{ background: theme.bg, color: theme.text }}
            >
              <span>Hints ({item.hints.length})</span>
              {hintsOpen ? <ChevronUp size={16} style={{ color: theme.muted }} /> : <ChevronDown size={16} style={{ color: theme.muted }} />}
            </button>
            <AnimatePresence>
              {hintsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 space-y-2" style={{ background: theme.card }}>
                    {item.hints.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: theme.muted }}>
                        <span className="font-bold mt-0.5" style={{ color: theme.accent }}>{i + 1}.</span>
                        {h}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: bin choices */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: theme.muted }}>Select the correct bin:</p>
          {BINS.map(bin => {
            const isChosen  = chosen === bin.id
            const isCorrect = result === 'correct' && isChosen
            const isWrong   = result === 'wrong'   && isChosen
            const revealOk  = result === 'correct' && bin.id === item.correctBin

            return (
              <motion.button
                key={bin.id}
                onClick={() => handleBin(bin.id)}
                disabled={result === 'correct'}
                whileHover={!result ? { scale: 1.02, y: -2 } : {}}
                whileTap={!result ? { scale: 0.98 } : {}}
                animate={isWrong ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.35 }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                style={{
                  background: isCorrect || revealOk ? `${bin.border}25` : bin.bg,
                  border: `2px solid ${isWrong ? '#EF4444' : isCorrect || revealOk ? bin.border : bin.border + '50'}`,
                  boxShadow: isCorrect || revealOk ? `0 0 18px ${bin.glow}` : 'none',
                  opacity: result === 'correct' && !isChosen && bin.id !== item.correctBin ? 0.4 : 1,
                  cursor: result === 'correct' ? 'default' : 'pointer',
                }}
              >
                {/* Bin icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {bin.id === 'blue' ? '🔵' : bin.id === 'green' ? '🟢' : '⚫'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{bin.label}</p>
                  <p className="text-xs text-white/60">{bin.desc}</p>
                </div>
                {(isCorrect || revealOk) && <span className="text-xl">✅</span>}
                {isWrong && <span className="text-xl">❌</span>}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-5 py-4 rounded-2xl text-center font-bold"
            style={result === 'correct'
              ? { background: 'linear-gradient(135deg,#064e3b,#065f46)', border: '2px solid #10B981', color: '#6EE7B7' }
              : { background: 'linear-gradient(135deg,#450a0a,#7f1d1d)', border: '2px solid #EF4444', color: '#FCA5A5' }
            }
          >
            {feedback}
            {result === 'correct' && (
              <div className="text-sm font-normal mt-1 opacity-80">
                +10 game points! (entertainment only)
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct answer reveal */}
      {result === 'correct' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-5 py-4 rounded-2xl space-y-2"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}
        >
          <p className="font-semibold text-sm" style={{ color: theme.text }}>
            The correct bin for <span className="capitalize font-bold">{item.name}</span> is the{' '}
            <span style={{ color: BINS.find(b => b.id === item.correctBin)?.border }}>
              {BINS.find(b => b.id === item.correctBin)?.label}
            </span>
          </p>
          <ul className="space-y-1">
            {item.hints.map((h, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: theme.muted }}>
                <span style={{ color: theme.accent }}>•</span>{h}
              </li>
            ))}
          </ul>
          <button onClick={nextItem}
            className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: theme.accent }}
          >
            Next Item
          </button>
        </motion.div>
      )}
    </div>
  )
}
