# Key Code Snippets - Live Tracking Implementation

## 1. State Management

```javascript
// Location tracking states
const [userLocation, setUserLocation] = useState(null)
const [userMapPosition, setUserMapPosition] = useState({ x: 0, y: 0 })
const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 })
const [locationLoading, setLocationLoading] = useState(true)
const [locationError, setLocationError] = useState(null)

// Booth management states
const [searchQuery, setSearchQuery] = useState('')
const [selectedTag, setSelectedTag] = useState(null)
const [filteredBooths, setFilteredBooths] = useState([])
```

## 2. GPS to Map Conversion Function

```javascript
const updateUserMapPosition = (latitude, longitude) => {
  if (mapDimensions.width === 0 || mapDimensions.height === 0) return

  // Simulate GPS-to-map conversion
  // Uses small decimal variation from GPS coordinates
  const latVariation = latitude % 0.001
  const lonVariation = longitude % 0.001
  
  // Map GPS variation to pixel coordinates
  // Lecture hall ~50m x 30m, map proportions similar
  const mapX = (latVariation / 0.001) * (mapDimensions.width * 0.8) + mapDimensions.width * 0.1
  const mapY = (lonVariation / 0.001) * (mapDimensions.height * 0.8) + mapDimensions.height * 0.1
  
  // Constrain within map boundaries
  setUserMapPosition({
    x: Math.max(0, Math.min(mapX, mapDimensions.width)),
    y: Math.max(0, Math.min(mapY, mapDimensions.height)),
  })
}
```

## 3. Map Dimensions & Initialization

```javascript
// Get map dimensions on image load and set initial user position
useEffect(() => {
  const floorImage = document.querySelector('.floor-image')
  
  if (floorImage) {
    const updateMapDimensions = () => {
      const width = floorImage.naturalWidth
      const height = floorImage.naturalHeight
      setMapDimensions({ width, height })
      // Initialize user at center of map
      setUserMapPosition({ x: width / 2, y: height / 2 })
    }
    
    if (floorImage.complete) {
      updateMapDimensions()
    } else {
      floorImage.onload = updateMapDimensions
    }
  }
}, [])
```

## 4. Geolocation Setup & Live Tracking

```javascript
useEffect(() => {
  if ('geolocation' in navigator) {
    // Request user's initial location (high accuracy)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
          floor: 'Career Fair Floor',
        }
        setUserLocation(locationData)
        setLocationLoading(false)
        
        // Convert GPS to map position
        updateUserMapPosition(latitude, longitude)
        
        // Log to Amplitude
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('map_page_loaded', {
            ...locationData,
            event_type: 'geolocation_initial_detection',
          })
        }
      },
      (error) => {
        setLocationError(error.message)
        setLocationLoading(false)
        console.warn('Geolocation error:', error)
        
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('geolocation_error', {
            error_code: error.code,
            error_message: error.message,
            timestamp: new Date().toISOString(),
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    // Watch user location for live tracking (every 3 seconds)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
          floor: 'Career Fair Floor',
        }
        setUserLocation(locationData)
        
        // Update user position on map
        updateUserMapPosition(latitude, longitude)
        
        // Log to Amplitude with map position
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('user_location_updated', {
            latitude,
            longitude,
            accuracy,
            map_position: { x: userMapPosition.x, y: userMapPosition.y },
            timestamp: new Date().toISOString(),
            event_type: 'geolocation_live_tracking',
          })
        }
      },
      (error) => {
        console.warn('Watch position error:', error)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 3000, // Update every 3 seconds max
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  } else {
    setLocationError('Geolocation is not supported by your browser')
    setLocationLoading(false)
  }
}, [userMapPosition])
```

## 5. Booth Click Handler with Location

```javascript
const handleBoothClick = (booth) => {
  setSelectedBooth(booth)
  
  // Track booth visit with Amplitude and location context
  if (window.amplitude) {
    window.amplitude.getInstance().logEvent('booth_clicked', {
      booth_id: booth.id,
      booth_name: booth.name,
      company_name: booth.companyName,
      user_location: userLocation,        // GPS data
      user_map_position: userMapPosition,  // Map position
      timestamp: new Date().toISOString(),
    })
  }
}
```

## 6. User Location Indicator JSX

```jsx
{/* User location indicator - live tracking */}
<div 
  className="user-location-indicator"
  style={{
    left: `${userMapPosition.x}px`,
    top: `${userMapPosition.y}px`,
  }}
  title={`You are here (accuracy: ${userLocation ? Math.round(userLocation.accuracy) : '?'}m)`}
>
  <div className="location-pulse"></div>
</div>
```

## 7. Analytics Panel Display

```jsx
{/* Geolocation & Analytics Info */}
<div className="analytics-section">
  <h3>📍 Live Location Tracking</h3>
  {locationLoading ? (
    <p className="analytics-info">
      <Loader size={16} className="spinner" /> Detecting location...
    </p>
  ) : locationError ? (
    <p className="analytics-info error">
      ❌ {locationError}
    </p>
  ) : userLocation ? (
    <div className="location-info">
      <p className="analytics-info success">
        ✓ Live tracking active
      </p>
      <p className="location-details">
        Lat: {userLocation.latitude.toFixed(4)}° <br />
        Lon: {userLocation.longitude.toFixed(4)}° <br />
        Accuracy: {Math.round(userLocation.accuracy)}m
      </p>
      <p className="location-details" style={{ fontSize: '12px', color: '#888' }}>
        Map Position: <br />
        X: {Math.round(userMapPosition.x)}px <br />
        Y: {Math.round(userMapPosition.y)}px
      </p>
      <p className="location-note">
        Live tracking enabled. Moving within lecture hall-sized venue.
      </p>
    </div>
  ) : null}
</div>
```

## 8. CSS - User Location Indicator Styling

```css
/* User location indicator - live tracking with red dot */
.user-location-indicator {
  position: absolute;
  width: 50px;
  height: 50px;
  z-index: 10;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.location-pulse {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2);
  animation: pulse 2s infinite;
}

.location-pulse::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: inherit;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 107, 107, 0.1);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

## 9. Amplitude Event Tracking Patterns

```javascript
// Event pattern 1: Initial detection
{
  event_type: 'geolocation_initial_detection',
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 25,
  floor: 'Career Fair Floor',
  timestamp: '2026-01-17T18:00:00Z'
}

// Event pattern 2: Live position update
{
  event_type: 'geolocation_live_tracking',
  latitude: 40.7129,
  longitude: -74.0061,
  accuracy: 18,
  map_position: { x: 450, y: 320 },
  timestamp: '2026-01-17T18:00:03Z'
}

// Event pattern 3: Booth interaction
{
  booth_id: '2',
  booth_name: 'Shopify Booth',
  company_name: 'Shopify',
  user_location: {
    latitude: 40.7130,
    longitude: -74.0062,
    accuracy: 22
  },
  user_map_position: { x: 470, y: 280 },
  timestamp: '2026-01-17T18:00:15Z'
}

// Event pattern 4: Error handling
{
  error_code: 1,  // PERMISSION_DENIED
  error_message: 'User denied geolocation',
  timestamp: '2026-01-17T18:00:05Z'
}
```

## 10. Convex Backend Integration

```javascript
// Calling Convex mutation with location data
if (window.amplitude) {
  // Log event to Amplitude
  window.amplitude.getInstance().logEvent('user_location_updated', {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    accuracy: userLocation.accuracy,
    map_position: userMapPosition,
    timestamp: new Date().toISOString(),
  })
}

// Save to backend (pseudo-code, actual call would use Convex client)
/*
import { api } from '../convex/_generated/api.js'
import { useMutation } from 'convex/react'

const saveLocation = useMutation(api.geolocation.saveUserLocation)

await saveLocation({
  latitude: userLocation.latitude,
  longitude: userLocation.longitude,
  accuracy: userLocation.accuracy,
  timestamp: new Date().toISOString(),
})
*/
```

## 11. Error Handling & Fallbacks

```javascript
// Browser compatibility check
useEffect(() => {
  if (!('geolocation' in navigator)) {
    setLocationError('Geolocation is not supported by your browser')
    setLocationLoading(false)
  }
}, [])

// GPS-to-map boundary checking
const updateUserMapPosition = (lat, lon) => {
  if (mapDimensions.width === 0 || mapDimensions.height === 0) {
    console.warn('Map dimensions not yet available')
    return
  }
  
  // Calculate position...
  
  // Ensure within boundaries
  const safeX = Math.max(0, Math.min(calculatedX, mapDimensions.width))
  const safeY = Math.max(0, Math.min(calculatedY, mapDimensions.height))
  
  setUserMapPosition({ x: safeX, y: safeY })
}

// Permission handling
navigator.geolocation.getCurrentPosition(
  success,
  (error) => {
    const errorMessages = {
      1: 'Permission denied. Enable location in browser settings.',
      2: 'Position unavailable. GPS signal lost.',
      3: 'Request timeout. Check your internet connection.',
    }
    setLocationError(errorMessages[error.code] || error.message)
  }
)
```

## 12. Testing Helper Function

```javascript
// Simulate user movement for testing
const simulateUserMovement = () => {
  const positions = [
    { lat: 40.7128, lon: -74.0060 },
    { lat: 40.7129, lon: -74.0061 },
    { lat: 40.7130, lon: -74.0062 },
    { lat: 40.7131, lon: -74.0063 },
  ]
  
  let index = 0
  setInterval(() => {
    const pos = positions[index % positions.length]
    updateUserMapPosition(pos.lat, pos.lon)
    index++
  }, 3000)
}

// Call for testing: simulateUserMovement()
```

---

These code snippets provide the core implementation for live geolocation tracking with GPS-to-map conversion and event logging.
