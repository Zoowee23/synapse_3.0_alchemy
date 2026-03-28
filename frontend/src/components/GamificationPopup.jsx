import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* Coin that flies up and fades */
function Coin({ x, delay }) {
  return (
    <motion.div
      initial={{ x, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: x + (Math.random()-0.5)*80, y: -180, opacity: 0, scale: 0.5 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      className="absolute bottom-0 text-2xl pointer-events-none select-none"
      style={{ left: '50%' }}
    >🪙</motion.div>
  )
}

/* Negative particle */
function Particle({ x, delay }) {
  return (
    <motion.div
      initial={{ x, y: 0, opacity: 1 }}
      animate={{ x: x + (Math.random()-0.5)*60, y: 80, opacity: 0 }}
      transition={{ duration: 0.9, delay, ease: 'easeIn' }}
      className="absolute top-0 text-xl pointer-events-none select-none"
      style={{ left: '50%' }}
    >💨</motion.div>
  )
}

export default function GamificationPopup({ data, onClose }) {
  const [coins, setCoins] = useState([])

  useEffect(() => {
    if (!data) return
    if (data.recyclable) {
      setCoins(Array.from({ length: Math.min(data.coins_gained || 5, 12) }, (_, i) => ({
        id: i, x: (Math.random()-0.5)*120, delay: i*0.08
      })))
    }
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [data])

  if (!data) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0, scale:0.7, y:40 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.8, y:20 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="relative">
          {/* Coin rain */}
          {data.recyclable && coins.map(c => <Coin key={c.id} x={c.x} delay={c.delay} />)}
          {!data.recyclable && coins.map(c => <Particle key={c.id} x={c.x} delay={c.delay} />)}

          {/* Main popup */}
          <div className={`rounded-2xl px-8 py-5 shadow-2xl text-center border-2 ${
            data.recyclable
              ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100'
              : 'bg-red-900/90 border-red-400 text-red-100'
          }`}>
            <div className="text-4xl mb-2">
              {data.recyclable ? '🎉' : '😬'}
            </div>
            <div className="font-bold text-lg">
              {data.recyclable ? 'Great Recycling!' : 'Non-Recyclable Item'}
            </div>
            {data.recyclable ? (
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <span>🪙</span><span>+{data.coins_gained} coins</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>⚡</span><span>+{data.xp_gained} XP</span>
                </div>
                {data.streak > 1 && (
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <span>🔥</span><span>{data.streak} day streak!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm opacity-80">
                <p>Dispose in the correct bin.</p>
                <p className="mt-1">+{data.xp_gained} XP for trying! 💪</p>
              </div>
            )}

            {/* New badge unlock */}
            {data.new_badges?.length > 0 && (
              <motion.div
                initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
                className="mt-3 bg-yellow-400/20 border border-yellow-400 rounded-xl px-4 py-2"
              >
                <div className="text-yellow-300 font-bold text-sm">🏅 Badge Unlocked!</div>
                {data.new_badges.map(b => (
                  <div key={b.id} className="text-yellow-200 text-xs mt-1">{b.icon} {b.name}</div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
