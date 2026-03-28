import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Trash2, Leaf } from 'lucide-react'

const CATEGORY_EMOJI = {
  plastic:   '🧴',
  paper:     '📄',
  cardboard: '📦',
  metal:     '🥫',
  glass:     '🍶',
  trash:     '🗑️',
}

export default function ResultCard({ result }) {
  const {
    prediction, confidence, top3,
    recyclable, bin, instructions,
    carbon_saved, color,
  } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="card space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="text-5xl">{CATEGORY_EMOJI[prediction] || '♻️'}</div>
        <div>
          <h2 className="text-2xl font-bold capitalize text-white">{prediction}</h2>
          <div className="flex items-center gap-2 mt-1">
            {recyclable ? (
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-sm px-3 py-1 rounded-full font-medium">
                <CheckCircle size={14} /> Recyclable
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-sm px-3 py-1 rounded-full font-medium">
                <XCircle size={14} /> Non-Recyclable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Confidence</span>
          <span className="text-white font-semibold">{(confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {/* Top 3 */}
      <div>
        <p className="text-slate-400 text-sm mb-2">Top Predictions</p>
        <div className="space-y-2">
          {top3.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-slate-400 text-xs w-16 capitalize">{item.label}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{ width: `${item.confidence * 100}%`, opacity: 1 - i * 0.3 }}
                />
              </div>
              <span className="text-slate-300 text-xs w-12 text-right">
                {(item.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bin */}
      <div className="bg-slate-700/50 rounded-xl p-4">
        <p className="text-slate-400 text-xs mb-1">Disposal Bin</p>
        <p className="text-white font-semibold text-lg">🗑️ {bin}</p>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-slate-400 text-sm mb-2">Instructions</p>
        <ul className="space-y-1">
          {instructions.map((inst, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 mt-0.5">•</span>
              {inst}
            </li>
          ))}
        </ul>
      </div>

      {/* Carbon saved */}
      {carbon_saved > 0 && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <Leaf size={20} className="text-emerald-400" />
          <div>
            <p className="text-emerald-400 font-semibold text-sm">+{carbon_saved} kg CO₂ saved</p>
            <p className="text-slate-400 text-xs">by recycling this item correctly</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
