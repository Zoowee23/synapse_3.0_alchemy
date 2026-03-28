import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { MapPin, Loader } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const recycleIcon = new L.DivIcon({
  html: '<div style="background:#10B981;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">♻️</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const userIcon = new L.DivIcon({
  html: '<div style="background:#3B82F6;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 14, { duration: 1.5 }) }, [pos])
  return null
}

export default function RecyclingMap() {
  const [pos,     setPos]     = useState(null)
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const { theme } = useTheme()

  const locate = () => {
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords
        setPos([lat, lon])
        try {
          const { data } = await axios.get(`/api/recycling-centers?lat=${lat}&lon=${lon}&radius=3000`)
          setCenters(data.centers || [])
        } catch {
          setError('Could not fetch recycling centers')
        } finally {
          setLoading(false)
        }
      },
      () => { setError('Location access denied'); setLoading(false) }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg" style={{ color: theme.text }}>
          📍 Nearby Recycling Centers
        </h2>
        <button onClick={locate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: theme.accent }}
        >
          {loading ? <Loader size={16} className="animate-spin"/> : <MapPin size={16}/>}
          {loading ? 'Locating...' : 'Find Near Me'}
        </button>
      </div>

      {error && (
        <div className="text-sm px-4 py-2 rounded-xl" style={{ background:'#EF444420', color:'#EF4444' }}>
          {error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: theme.border, height: 380 }}>
        <MapContainer
          center={pos || [20, 0]}
          zoom={pos ? 14 : 2}
          style={{ height:'100%', width:'100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {pos && (
            <>
              <FlyTo pos={pos} />
              <Marker position={pos} icon={userIcon}>
                <Popup>📍 You are here</Popup>
              </Marker>
              <Circle center={pos} radius={3000} pathOptions={{ color: theme.accent, fillOpacity:0.05 }} />
            </>
          )}
          {centers.map(c => (
            <Marker key={c.id} position={[c.lat, c.lon]} icon={recycleIcon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">♻️ {c.name}</div>
                  {c.types.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Accepts: {c.types.slice(0,5).join(', ')}
                    </div>
                  )}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}&zoom=17`}
                    target="_blank" rel="noreferrer"
                    className="text-blue-500 text-xs mt-1 block hover:underline"
                  >
                    Open in Maps →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {centers.length > 0 && (
        <p className="text-sm" style={{ color: theme.muted }}>
          Found {centers.length} recycling point{centers.length !== 1 ? 's' : ''} within 3km
        </p>
      )}
    </div>
  )
}
