import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Loader, Navigation } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => new L.DivIcon({
  html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">♻</div>`,
  className: '', iconSize: [30, 30], iconAnchor: [15, 15],
})

const userIcon = new L.DivIcon({
  html: '<div style="background:#3B82F6;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>',
  className: '', iconSize: [14, 14], iconAnchor: [7, 7],
})

const CAT_COLOR = {
  recycling:        '#10B981',
  waste_disposal:   '#6B7280',
  transfer_station: '#F59E0B',
  reuse:            '#8B5CF6',
}

const CAT_LABEL = {
  recycling:        'Recycling Point',
  waste_disposal:   'Waste Disposal',
  transfer_station: 'Transfer Station',
  reuse:            'Reuse / Charity',
}

// Component to fly map to a position
function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo(pos, 14, { duration: 1.2 })
  }, [pos, map])
  return null
}

// Geocode a city/address using Nominatim (OpenStreetMap)
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'EcoLabelVision/2.0' } })
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name }
}

// Fetch recycling locations from Overpass
async function fetchCenters(lat, lon, radius = 5000) {
  const q = `[out:json][timeout:20];(node["amenity"="recycling"](around:${radius},${lat},${lon});node["recycling_type"="centre"](around:${radius},${lat},${lon});node["amenity"="waste_disposal"](around:${radius},${lat},${lon});node["shop"="second_hand"](around:${radius},${lat},${lon});node["shop"="charity"](around:${radius},${lat},${lon});way["amenity"="recycling"](around:${radius},${lat},${lon}););out center body;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  })
  if (!res.ok) throw new Error(`Overpass error ${res.status}`)
  const json = await res.json()
  return (json.elements || []).map(el => {
    const tags = el.tags || {}
    const elat = el.lat ?? el.center?.lat
    const elon = el.lon ?? el.center?.lon
    if (!elat || !elon) return null
    const amenity = tags.amenity || ''
    const shop    = tags.shop    || ''
    let category = 'recycling'
    if (amenity === 'waste_disposal') category = 'waste_disposal'
    else if (amenity === 'waste_transfer_station') category = 'transfer_station'
    else if (shop === 'second_hand' || shop === 'charity') category = 'reuse'
    const name  = tags.name || tags.operator || tags.brand || CAT_LABEL[category]
    const types = Object.keys(tags).filter(k => k.startsWith('recycling:') && tags[k] === 'yes').map(k => k.replace('recycling:', ''))
    return { id: el.id, lat: elat, lon: elon, name, category, types: types.slice(0, 5), opening_hours: tags.opening_hours || '', phone: tags.phone || '' }
  }).filter(Boolean).slice(0, 50)
}

export default function RecyclingMap() {
  const [query,   setQuery]   = useState('')
  const [pos,     setPos]     = useState(null)
  const [label,   setLabel]   = useState('')
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const { theme } = useTheme()

  const search = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setCenters([])
    try {
      const { lat, lon, display } = await geocode(query)
      setPos([lat, lon])
      setLabel(display)
      const results = await fetchCenters(lat, lon, 5000)
      setCenters(results)
      if (!results.length) setError('No recycling locations found within 5 km of this area.')
    } catch (e) {
      setError(e.message || 'Search failed. Try a different location.')
    } finally {
      setLoading(false)
    }
  }

  // Also support GPS
  const useGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return }
    setLoading(true); setError(null); setCenters([])
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        setPos([lat, lon])
        setLabel('Your current location')
        try {
          const results = await fetchCenters(lat, lon, 5000)
          setCenters(results)
          if (!results.length) setError('No recycling locations found within 5 km.')
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
      },
      () => { setError('Location access denied.'); setLoading(false) },
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg mb-1" style={{ color: theme.text }}>
          Find Nearby Recycling Locations
        </h2>
        <p className="text-xs mb-3" style={{ color: theme.muted }}>
          Type any city, address, or postcode — powered by OpenStreetMap
        </p>

        {/* Search bar */}
        <form onSubmit={search} className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Mumbai, London, New York..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: theme.accent }}
          >
            {loading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
          <button type="button" onClick={useGPS} disabled={loading}
            className="px-3 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 border"
            style={{ borderColor: theme.border, color: theme.muted }}
            title="Use my GPS location"
          >
            <Navigation size={15} />
          </button>
        </form>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: '#EF444415', color: '#F87171', border: '1px solid #EF444430' }}>
          {error}
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: theme.border, height: 380 }}>
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {pos && (
            <>
              <FlyTo pos={pos} />
              <Marker position={pos} icon={userIcon}>
                <Popup><b>Search location</b><br /><span style={{ fontSize: 11 }}>{label}</span></Popup>
              </Marker>
            </>
          )}
          {centers.map(c => (
            <Marker key={c.id} position={[c.lat, c.lon]} icon={makeIcon(CAT_COLOR[c.category] || '#10B981')}>
              <Popup>
                <div style={{ minWidth: 170 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 3 }}>{CAT_LABEL[c.category]}</div>
                  {c.types.length > 0 && <div style={{ fontSize: 11 }}>Accepts: {c.types.join(', ')}</div>}
                  {c.opening_hours && <div style={{ fontSize: 11, color: '#6B7280' }}>Hours: {c.opening_hours}</div>}
                  <a href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}&zoom=17`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#3B82F6', fontSize: 11, display: 'block', marginTop: 5 }}>
                    Open in OpenStreetMap →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Results list */}
      {centers.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          <p className="text-xs font-semibold" style={{ color: theme.muted }}>
            {centers.length} location{centers.length !== 1 ? 's' : ''} found near {query || 'your location'}
          </p>
          {centers.map(c => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{ background: (CAT_COLOR[c.category] || '#10B981') + '25', color: CAT_COLOR[c.category] || '#10B981' }}>
                ♻
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: theme.text }}>{c.name}</p>
                <p className="text-xs" style={{ color: theme.muted }}>{CAT_LABEL[c.category]}</p>
                {c.types.length > 0 && <p className="text-xs truncate" style={{ color: theme.muted }}>Accepts: {c.types.join(', ')}</p>}
              </div>
              <a href={`https://www.google.com/maps?q=${c.lat},${c.lon}`}
                target="_blank" rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0"
                style={{ background: (theme.accent) + '20', color: theme.accent }}>
                Directions
              </a>
            </div>
          ))}
        </div>
      )}

      {!pos && !loading && (
        <p className="text-center text-sm py-4" style={{ color: theme.muted }}>
          Enter a location above to find nearby recycling points
        </p>
      )}
    </div>
  )
}
