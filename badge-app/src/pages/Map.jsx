import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore.js'
import { MapPin, Search, Filter, Loader } from 'lucide-react'
import './Map.css'

// Room simulation constants - 75m x 75m total space
const ROOM_WIDTH_METERS = 75
const ROOM_HEIGHT_METERS = 75
const ROOM_BOUNDS = {
  minX: 0.125,    // 9.375% - left edge of room
  maxX: 0.875,    // 87.5% - right edge of room
  minY: 0.125,    // 9.375% - top edge of room
  maxY: 0.875,    // 87.5% - bottom edge of room
}

// Sponsor booths distributed within the room (as percentages of map width/height)
// Spaced evenly apart: Google (top-left), Shopify (top-right), 
// Amplitude (bottom-left), Foresters (bottom-right) with good spacing
const SPONSOR_BOOTHS = [
  {
    id: '1',
    name: 'Google',
    companyName: 'Google',
    description: 'Search & Cloud Solutions',
    x: 0.2,    // 20% from left
    y: 0.2,    // 20% from top
    color: '#4285F4',
    tags: ['AI/ML', 'Cloud', 'Web Dev'],
    talkingPoints: 'Visit us to learn about our latest innovations',
    keyPeople: [
      {
        id: 'p1',
        name: 'To be announced',
        role: 'TBA',
        company: 'Google',
        bio: 'Connect with us at the booth',
        expertise: ['AI/ML', 'Cloud', 'Web Dev'],
      },
    ],
  },
  {
    id: '2',
    name: 'Shopify',
    companyName: 'Shopify',
    description: 'E-Commerce Platform',
    x: 0.8,    // 80% from left
    y: 0.2,    // 20% from top
    color: '#96BE28',
    tags: ['E-Commerce', 'Web Dev', 'Payments'],
    talkingPoints: 'Explore opportunities with the commerce platform',
    keyPeople: [
      {
        id: 'p2',
        name: 'To be announced',
        role: 'TBA',
        company: 'Shopify',
        bio: 'Connect with us at the booth',
        expertise: ['E-Commerce', 'Web Dev', 'Payments'],
      },
    ],
  },
  {
    id: '3',
    name: 'Amplitude',
    companyName: 'Amplitude',
    description: 'Analytics & Data Platform',
    x: 0.2,    // 20% from left
    y: 0.8,    // 80% from top
    color: '#7B68EE',
    tags: ['Analytics', 'Data Science', 'Product'],
    talkingPoints: 'Discover data-driven product insights',
    keyPeople: [
      {
        id: 'p3',
        name: 'To be announced',
        role: 'TBA',
        company: 'Amplitude',
        bio: 'Connect with us at the booth',
        expertise: ['Analytics', 'Data Science', 'Product'],
      },
    ],
  },
  {
    id: '4',
    name: 'Foresters Financial',
    companyName: 'Foresters Financial',
    description: 'Financial Services & Insurance',
    x: 0.8,    // 80% from left
    y: 0.8,    // 80% from top
    color: '#FF6B35',
    tags: ['Finance', 'Insurance', 'Actuarial'],
    talkingPoints: 'Build your career in financial services',
    keyPeople: [
      {
        id: 'p4',
        name: 'To be announced',
        role: 'TBA',
        company: 'Foresters Financial',
        bio: 'Connect with us at the booth',
        expertise: ['Finance', 'Insurance', 'Actuarial'],
      },
    ],
  },
]

export default function Map() {
  const { selectedBooth, setSelectedBooth } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [filteredBooths, setFilteredBooths] = useState(SPONSOR_BOOTHS)
  const [userLocation, setUserLocation] = useState(null)
  const [userPixelPosition, setUserPixelPosition] = useState({ x: 50, y: 50 })
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState(null)
  
  // Refs for managing geolocation
  const watchIdRef = useRef(null)
  const initialLocationRef = useRef(null)

  // Initialize real-time geolocation tracking
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser')
      setLocationLoading(false)
      return
    }

    // Get initial location to establish center point
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        initialLocationRef.current = { latitude, longitude }
        setUserLocation({ latitude, longitude, accuracy })
        setLocationLoading(false)
        console.log(`Initial position: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`)
        
        // Log to Amplitude
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('map_page_loaded', {
            latitude,
            longitude,
            accuracy,
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
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Start continuous real-time tracking with watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation({ latitude, longitude, accuracy })
        
        if (initialLocationRef.current) {
          // Calculate offset from initial position
          const latDiff = latitude - initialLocationRef.current.latitude
          const lonDiff = longitude - initialLocationRef.current.longitude
          
          // Convert meters per degree (approximate)
          const metersPerDegreeLat = 111000
          const metersPerDegreeLon = 111000 * Math.cos((latitude * Math.PI) / 180)
          
          const metersLat = latDiff * metersPerDegreeLat
          const metersLon = lonDiff * metersPerDegreeLon
          
          // Convert to position within 75m × 75m room
          // User starts at center of room: map center (0.5, 0.5)
          // Room extends from 12.5% to 87.5% on both axes
          const roomCenterX = 0.5
          const roomCenterY = 0.5
          const roomHalfWidth = ROOM_WIDTH_METERS / 2  // 37.5m
          const roomHalfHeight = ROOM_HEIGHT_METERS / 2 // 37.5m
          
          // Convert meters to percentage of map (total 100%)
          const percentX = (metersLon / (ROOM_WIDTH_METERS * 2)) * 100
          const percentY = -(metersLat / (ROOM_HEIGHT_METERS * 2)) * 100
          
          // Position relative to room center
          let pixelX = roomCenterX * 100 + percentX
          let pixelY = roomCenterY * 100 + percentY
          
          // Constrain to room bounds (12.5% to 87.5%)
          const minX = ROOM_BOUNDS.minX * 100
          const maxX = ROOM_BOUNDS.maxX * 100
          const minY = ROOM_BOUNDS.minY * 100
          const maxY = ROOM_BOUNDS.maxY * 100
          
          setUserPixelPosition({
            x: Math.max(minX, Math.min(maxX, pixelX)),
            y: Math.max(minY, Math.min(maxY, pixelY)),
          })
        }
        
        console.log(`Location updated: ${latitude}, ${longitude} → Position: ${userPixelPosition.x.toFixed(1)}%, ${userPixelPosition.y.toFixed(1)}%`)
        
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('user_location_updated', {
            latitude,
            longitude,
            accuracy,
            event_type: 'geolocation_continuous_tracking',
          })
        }
      },
      (error) => {
        console.warn('Watch position error:', error)
        if (window.amplitude) {
          window.amplitude.getInstance().logEvent('geolocation_watch_error', {
            error_code: error.code,
            error_message: error.message,
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 500,  // Update more frequently for live tracking
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Handle filtering and search
  useEffect(() => {
    let filtered = SPONSOR_BOOTHS

    if (searchQuery) {
      filtered = filtered.filter(
        (booth) =>
          booth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booth.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedTag) {
      filtered = filtered.filter((booth) => booth.tags.includes(selectedTag))
    }

    setFilteredBooths(filtered)
  }, [searchQuery, selectedTag])

  const allTags = Array.from(new Set(SPONSOR_BOOTHS.flatMap((b) => b.tags)))

  const handleBoothClick = (booth) => {
    setSelectedBooth(booth)
    
    if (window.amplitude) {
      window.amplitude.getInstance().logEvent('booth_clicked', {
        booth_id: booth.id,
        booth_name: booth.name,
        company_name: booth.companyName,
        user_position: userPixelPosition,
        timestamp: new Date().toISOString(),
      })
    }
    
    console.log('Booth clicked:', booth.name)
  }

  const getDistanceToUser = (booth) => {
    if (!userPixelPosition) return null
    // Convert booth position from decimal (0-1) to percentage (0-100)
    const boothPixelX = booth.x * 100
    const boothPixelY = booth.y * 100
    
    const dx = boothPixelX - userPixelPosition.x
    const dy = boothPixelY - userPixelPosition.y
    const pixelDistance = Math.sqrt(dx * dx + dy * dy)
    
    // Convert pixel distance to meters
    // 75% of map = 75m of room (from 12.5% to 87.5%)
    // So 1% of map ≈ 1m in the room
    const estimatedDistance = Math.round(pixelDistance)
    return estimatedDistance
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Career Fair Map</h1>
        <p className="subtitle">Real-time tracking enabled • 75m × 75m venue</p>
      </div>

      <div className="map-container">
        {/* Map View */}
        <div className="map-view">
          <div className="map-canvas">
            {/* Floor image background */}
            <div className="floor-image-container">
              <img 
                src="/floor-map.jpg" 
                alt="Career Fair Floor Map" 
                className="floor-image"
              />
              
              {/* User real-time location indicator */}
              {!locationError && (
                <div 
                  className="user-location-dot"
                  style={{
                    left: `${userPixelPosition.x}%`,
                    top: `${userPixelPosition.y}%`,
                  }}
                  title={`You are here${userLocation ? ` (accuracy: ${Math.round(userLocation.accuracy)}m)` : ''}`}
                >
                  <div className="location-pulse"></div>
                  <div className="location-inner"></div>
                </div>
              )}

              {/* Sponsor booth markers */}
              {filteredBooths.map((booth) => (
                <div
                  key={booth.id}
                  className={`booth-marker ${
                    selectedBooth?.id === booth.id ? 'selected' : ''
                  }`}
                  style={{
                    left: `${booth.x}%`,
                    top: `${booth.y}%`,
                    '--booth-color': booth.color,
                  }}
                  onClick={() => handleBoothClick(booth)}
                  title={`${booth.name} - Click for details`}
                >
                  <div className="booth-pin" style={{ backgroundColor: booth.color }}>
                    <MapPin size={16} />
                  </div>
                  <div className="booth-label">
                    <strong>{booth.name}</strong>
                    {!locationError && (
                      <div className="booth-distance">
                        ~{getDistanceToUser(booth)}m away
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booth details popup */}
          {selectedBooth && (
            <div className="booth-details-popup">
              <button
                className="close-btn"
                onClick={() => setSelectedBooth(null)}
              >
                ×
              </button>
              <h2>{selectedBooth.name}</h2>
              <p className="company-name">{selectedBooth.companyName}</p>
              <p className="description">{selectedBooth.description}</p>

              {selectedBooth.talkingPoints && (
                <div className="talking-points-section">
                  <h3>Suggested Talking Points</h3>
                  <p>{selectedBooth.talkingPoints}</p>
                </div>
              )}

              {!locationError && (
                <div className="distance-info">
                  <strong>📍 Distance from you: ~{getDistanceToUser(selectedBooth)}m</strong>
                </div>
              )}

              <div className="tags">
                {selectedBooth.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="key-people">
                <h3>Key People</h3>
                {selectedBooth.keyPeople.map((person) => (
                  <div key={person.id} className="person-card">
                    <div className="person-info">
                      <h4>{person.name}</h4>
                      <p className="role">{person.role}</p>
                      <p className="bio">{person.bio}</p>
                      <div className="expertise">
                        {person.expertise.map((skill) => (
                          <span key={skill} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="map-sidebar">
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search booths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-section">
            <h3>
              <Filter size={18} />
              Filter by Interest
            </h3>
            <div className="tag-filter">
              <button
                className={`filter-tag ${!selectedTag ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`filter-tag ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="booths-list">
            <h3>Booths ({filteredBooths.length})</h3>
            {filteredBooths.length > 0 ? (
              <div className="booth-items">
                {filteredBooths.map((booth) => (
                  <div
                    key={booth.id}
                    className={`booth-item ${
                      selectedBooth?.id === booth.id ? 'selected' : ''
                    }`}
                    onClick={() => handleBoothClick(booth)}
                  >
                    <div className="booth-header">
                      <div className="booth-title-wrapper">
                        <div 
                          className="booth-color-dot"
                          style={{ backgroundColor: booth.color }}
                        />
                        <h4>{booth.name}</h4>
                      </div>
                      {!locationError && (
                        <div className="booth-distance-badge">
                          ~{getDistanceToUser(booth)}m
                        </div>
                      )}
                    </div>
                    <p className="booth-company">{booth.companyName}</p>
                    <p className="booth-desc">{booth.description}</p>
                    <div className="booth-tags">
                      {booth.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="tiny-tag">
                          {tag}
                        </span>
                      ))}
                      {booth.tags.length > 2 && (
                        <span className="tiny-tag">+{booth.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No booths found</p>
            )}
          </div>

          {/* Geolocation Status Panel */}
          <div className="analytics-section">
            <h3>📍 Location Status</h3>
            {locationLoading ? (
              <p className="analytics-info loading">
                <Loader size={16} className="spinner" /> Detecting location...
              </p>
            ) : locationError ? (
              <p className="analytics-info error">
                ❌ {locationError}
              </p>
            ) : userLocation ? (
              <div className="location-info">
                <p className="analytics-info success">
                  ✓ Real-time tracking active
                </p>
                <p className="location-details">
                  Lat: {userLocation.latitude.toFixed(4)}° <br />
                  Lon: {userLocation.longitude.toFixed(4)}° <br />
                  Accuracy: ±{Math.round(userLocation.accuracy)}m
                </p>
                <p className="location-note">
                  Your position: {userPixelPosition.x.toFixed(1)}% × {userPixelPosition.y.toFixed(1)}%
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
