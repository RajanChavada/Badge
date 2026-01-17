import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore.js'
import { MapPin, Search, Filter, Loader } from 'lucide-react'
import './Map.css'

// Floor map booths with pixel coordinates relative to the floor image
const FLOOR_MAP_BOOTHS = [
  {
    id: '1',
    name: 'Google Sponsor Booth',
    companyName: 'Google',
    description: '<to be filled later>',
    x: 150,
    y: 200,
    tags: ['AI/ML', 'Cloud', 'Web Dev'],
    talkingPoints: '<to be filled later>',
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
    name: 'Shopify Booth',
    companyName: 'Shopify',
    description: '<to be filled later>',
    x: 400,
    y: 150,
    tags: ['E-Commerce', 'Web Dev', 'Payments'],
    talkingPoints: '<to be filled later>',
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
    name: 'Amplitude Booth',
    companyName: 'Amplitude',
    description: '<to be filled later>',
    x: 300,
    y: 350,
    tags: ['Analytics', 'Data Science', 'Product'],
    talkingPoints: '<to be filled later>',
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
    name: 'Foresters Financial Booth',
    companyName: 'Foresters Financial',
    description: '<to be filled later>',
    x: 550,
    y: 280,
    tags: ['Finance', 'Insurance', 'Actuarial'],
    talkingPoints: '<to be filled later>',
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

// Legacy mock data for reference
const MOCK_BOOTHS = [
  {
    id: '1',
    name: 'Google Booth',
    companyName: 'Google',
    description: 'Search & Advertising platform',
    latitude: 40.7128,
    longitude: -74.006,
    tags: ['AI/ML', 'Cloud', 'Web Dev'],
    keyPeople: [
      {
        id: 'p1',
        name: 'Sarah Chen',
        role: 'Engineering Manager',
        company: 'Google',
        bio: 'Leading ML infrastructure team',
        expertise: ['ML', 'System Design', 'Leadership'],
      },
    ],
  },
  {
    id: '2',
    name: 'Microsoft Booth',
    companyName: 'Microsoft',
    description: 'Cloud & Enterprise Solutions',
    latitude: 40.715,
    longitude: -74.008,
    tags: ['Cloud', 'Enterprise', 'Security'],
    keyPeople: [
      {
        id: 'p2',
        name: 'James Wilson',
        role: 'Senior Developer',
        company: 'Microsoft',
        bio: 'Azure cloud architect',
        expertise: ['Cloud Architecture', 'DevOps', 'Security'],
      },
    ],
  },
  {
    id: '3',
    name: 'Meta Booth',
    companyName: 'Meta',
    description: 'Social & VR Innovation',
    latitude: 40.71,
    longitude: -74.004,
    tags: ['Web Dev', 'VR/AR', 'Mobile Dev'],
    keyPeople: [
      {
        id: 'p3',
        name: 'Emma Rodriguez',
        role: 'Product Manager',
        company: 'Meta',
        bio: 'Building next-gen social experiences',
        expertise: ['Product', 'UX', 'Community'],
      },
    ],
  },
]

export default function Map() {
  const { booths, selectedBooth, setBooths, setSelectedBooth } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [filteredBooths, setFilteredBooths] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState(null)

  // Initialize geolocation tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      // Request user's current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            floor: 'MyHall Floor 3', // Assuming this floor location
          }
          setUserLocation(locationData)
          setLocationLoading(false)
          console.log(`User location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`)
          
          // Track location with Amplitude
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
          
          // Log error to Amplitude
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

      // Watch user location for continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString(),
            floor: 'MyHall Floor 3',
          }
          setUserLocation(locationData)
          console.log(`Location updated: ${latitude}, ${longitude}`)
          
          // Log continuous location updates to Amplitude
          if (window.amplitude) {
            window.amplitude.getInstance().logEvent('user_location_updated', {
              ...locationData,
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
              timestamp: new Date().toISOString(),
            })
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 10000,
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      setLocationError('Geolocation is not supported by your browser')
      setLocationLoading(false)
    }
  }, [])

  // Initialize booths from floor map data
  useEffect(() => {
    // TODO: Fetch booths from Convex backend
    setBooths(FLOOR_MAP_BOOTHS)
  }, [setBooths])

  useEffect(() => {
    let filtered = booths

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
  }, [booths, searchQuery, selectedTag])

  const allTags = Array.from(new Set(booths.flatMap((b) => b.tags)))

  const handleBoothClick = (booth) => {
    setSelectedBooth(booth)
    
    // Track booth visit with Amplitude and store in app state
    if (window.amplitude) {
      window.amplitude.getInstance().logEvent('booth_clicked', {
        booth_id: booth.id,
        booth_name: booth.name,
        company_name: booth.companyName,
        user_location: userLocation,
        timestamp: new Date().toISOString(),
      })
    }
    
    // Store booth visit in app state for backend sync
    const boothVisit = {
      boothId: booth.id,
      boothName: booth.name,
      companyName: booth.companyName,
      visitedAt: new Date().toISOString(),
      userLocation,
    }
    
    // Add to store (will be synced to Convex backend)
    // TODO: This will be persisted to Convex
    console.log('Booth visit recorded:', boothVisit)
  }

  const handleGeneratePersonalizedSummary = (booth) => {
    // TODO: Call AI service to generate personalized booth summary
    // based on user's resume, interests, and target roles
    console.log('Generate summary for booth:', booth.id)
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Career Fair Map</h1>
        <p className="subtitle">Explore booths and companies</p>
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
              
              {/* User location indicator */}
              {userLocation && !locationError && (
                <div 
                  className="user-location-indicator"
                  title={`You are here (accuracy: ${Math.round(userLocation.accuracy)}m)`}
                >
                  <div className="location-pulse"></div>
                </div>
              )}

              {/* Booth markers */}
              {filteredBooths.map((booth, index) => (
                <div
                  key={booth.id}
                  className={`booth-marker-dot ${
                    selectedBooth?.id === booth.id ? 'selected' : ''
                  }`}
                  style={{
                    left: `${booth.x}px`,
                    top: `${booth.y}px`,
                  }}
                  onClick={() => handleBoothClick(booth)}
                  title={booth.name}
                >
                  <div className="marker-number">{index + 1}</div>
                  <div className="marker-tooltip">{booth.name}</div>
                </div>
              ))}
            </div>
          </div>

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

              <button
                className="btn-personalized-summary"
                onClick={() => handleGeneratePersonalizedSummary(selectedBooth)}
              >
                Get Personalized Summary
              </button>
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
                      <h4>{booth.name}</h4>
                      <MapPin size={16} />
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

          {/* Geolocation & Analytics Info */}
          <div className="analytics-section">
            <h3>📍 Geolocation Status</h3>
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
                  ✓ Location detected
                </p>
                <p className="location-details">
                  Lat: {userLocation.latitude.toFixed(4)}° <br />
                  Lon: {userLocation.longitude.toFixed(4)}° <br />
                  Accuracy: {Math.round(userLocation.accuracy)}m
                </p>
                <p className="location-note">
                  Assuming this floor location for booth proximity tracking
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
