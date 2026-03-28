import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Upload, ArrowLeftRight } from 'lucide-react'

const API = '/api'

function DropZone({ label, onResult }) {
  const [preview, setPreview] = useState(null)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = async (files) => {
    const file = files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await axios.post(`${API}/predict?user_id=compare`, fd)
      setResult(data)
      onResult(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

  return (
    <div className="card space-y-3">
      <p className="text-slate-400 font-medium text-sm">{label}</p>
      <div {...getRootProps()} className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-slate-400 transition-colors">
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="preview" className="w-full rounded-lg max-h-40 object-cover" />
        ) : (
          <>
            <Upload size={32} className="mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400 text-sm">Drop image</p>
          </>
        )}
      </div>
      {loading && <p className="text-emerald-400 text-sm text-center">Analyzing...</p>}
      {result && (
        <div className="space-y-1 text-sm">
          <p className="text-white font-semibold capitalize">{result.prediction}</p>
          <p className="text-slate-400">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <span className={`text-xs px-2 py-1 rounded-full ${result.recyclable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {result.recyclable ? '✓ Recyclable' : '✗ Non-Recyclable'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function CompareView() {
  const [resultA, setResultA] = useState(null)
  const [resultB, setResultB] = useState(null)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <ArrowLeftRight size={20} className="text-emerald-400" /> Compare Two Items
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <DropZone label="Image A" onResult={setResultA} />
        <DropZone label="Image B" onResult={setResultB} />
      </div>
      {resultA && resultB && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Comparison</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-slate-400">Metric</div>
            <div className="text-slate-300 font-medium">Image A</div>
            <div className="text-slate-300 font-medium">Image B</div>
            {['prediction', 'confidence', 'recyclable', 'bin'].map((key) => (
              <>
                <div key={key + 'k'} className="text-slate-500 capitalize">{key}</div>
                <div key={key + 'a'} className="text-white capitalize">
                  {key === 'confidence' ? `${(resultA[key] * 100).toFixed(1)}%` : String(resultA[key])}
                </div>
                <div key={key + 'b'} className="text-white capitalize">
                  {key === 'confidence' ? `${(resultB[key] * 100).toFixed(1)}%` : String(resultB[key])}
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
