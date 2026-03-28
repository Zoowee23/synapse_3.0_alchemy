import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, RefreshCw, Volume2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import ResultCard from '../components/ResultCard'
import CompareView from '../components/CompareView'

const API = '/api'
const USER_ID = 'user_demo'

export default function Scanner() {
  const [mode, setMode]           = useState('upload') // 'upload' | 'webcam' | 'compare'
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [liveActive, setLiveActive] = useState(false)
  const webcamRef = useRef(null)
  const liveTimer = useRef(null)

  // ── Upload via dropzone ──────────────────────────────────────────────────
  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('user_id', USER_ID)
      const { data } = await axios.post(`${API}/predict?user_id=${USER_ID}`, fd)
      setResult(data)
      speak(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  })

  // ── Webcam capture ───────────────────────────────────────────────────────
  const captureOnce = useCallback(async () => {
    const img = webcamRef.current?.getScreenshot()
    if (!img) return
    setPreview(img)
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API}/predict/base64`, {
        image: img, user_id: USER_ID,
      })
      setResult(data)
      speak(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleLive = () => {
    if (liveActive) {
      clearInterval(liveTimer.current)
      setLiveActive(false)
    } else {
      setLiveActive(true)
      liveTimer.current = setInterval(captureOnce, 3000)
    }
  }

  // ── Voice output ─────────────────────────────────────────────────────────
  const speak = (data) => {
    if (!window.speechSynthesis) return
    const msg = `This item is ${data.recyclable ? 'recyclable' : 'non-recyclable'} ${data.prediction}. ${data.recyclable ? 'Put it in the ' + data.bin : 'Dispose in general waste.'}`
    const utt = new SpeechSynthesisUtterance(msg)
    window.speechSynthesis.speak(utt)
  }

  const reset = () => {
    setResult(null)
    setPreview(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Smart Waste Scanner</h1>
        <p className="text-slate-400">Upload an image or use your webcam to identify waste</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 justify-center">
        {['upload', 'webcam', 'compare'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className={`px-5 py-2 rounded-xl font-medium text-sm capitalize transition-all ${
              mode === m ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {m === 'upload' && <Upload size={14} className="inline mr-1" />}
            {m === 'webcam' && <Camera size={14} className="inline mr-1" />}
            {m}
          </button>
        ))}
      </div>

      {mode === 'compare' ? (
        <CompareView userId={USER_ID} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="card space-y-4">
            {mode === 'upload' ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={40} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-300 font-medium">Drop image here or click to upload</p>
                <p className="text-slate-500 text-sm mt-1">JPG, PNG, WEBP supported</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full"
                  videoConstraints={{ facingMode: 'environment' }}
                />
                {liveActive && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 scan-line" />
                )}
              </div>
            )}

            {preview && mode === 'upload' && (
              <img src={preview} alt="preview" className="w-full rounded-xl object-cover max-h-48" />
            )}

            <div className="flex gap-2">
              {mode === 'webcam' && (
                <>
                  <button onClick={captureOnce} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Camera size={18} /> Capture
                  </button>
                  <button
                    onClick={toggleLive}
                    className={`flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-3 rounded-xl transition-all ${
                      liveActive ? 'bg-red-500 hover:bg-red-400 text-white' : 'btn-secondary'
                    }`}
                  >
                    <RefreshCw size={18} className={liveActive ? 'animate-spin' : ''} />
                    {liveActive ? 'Stop Live' : 'Live Mode'}
                  </button>
                </>
              )}
              {result && (
                <button onClick={reset} className="btn-secondary flex items-center gap-2">
                  <RefreshCw size={16} /> Reset
                </button>
              )}
              {result && (
                <button onClick={() => speak(result)} className="btn-secondary flex items-center gap-2">
                  <Volume2 size={16} />
                </button>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 text-emerald-400 py-4">
                <RefreshCw size={20} className="animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right: Result */}
          <AnimatePresence>
            {result ? (
              <ResultCard result={result} />
            ) : (
              <div className="card flex items-center justify-center text-slate-500 text-center">
                <div>
                  <div className="text-6xl mb-4">♻️</div>
                  <p>Scan or upload an item to see results</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
