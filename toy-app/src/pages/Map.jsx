import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore.js'
import { MapPin, Search, Filter } from 'lucide-react'
import './Map.css'

// Mock data for booths - replace with Convex data
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

  useEffect(() => {
    // TODO: Fetch booths from Convex backend
    // Include geolocation tracking with Amplitude
    setBooths(MOCK_BOOTHS)
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
    // TODO: Track booth visit with Amplitude
    // Start tracking time spent at booth
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
            <svg viewBox="0 0 800 600" className="map-svg">
              {/* Simple SVG map background */}
              <rect width="800" height="600" fill="#e8f4f8" />
              <g className="grid" opacity="0.1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={i * 75}
                    x2="800"
                    y2={i * 75}
                    stroke="#999"
                  />
                ))}
                {Array.from({ length: 11 }).map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 80}
                    y1="0"
                    x2={i * 80}
                    y2="600"
                    stroke="#999"
                  />
                ))}
              </g>

              {/* Plot booth markers */}
              {filteredBooths.map((booth, index) => {
                const x = (booth.longitude + 74.01) * 100000 % 800
                const y = (booth.latitude - 40.71) * 100000 % 600
                return (
                  <g key={booth.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r="20"
                      fill={
                        selectedBooth?.id === booth.id ? '#667eea' : '#764ba2'
                      }
                      opacity="0.8"
                      className="booth-marker"
                      onClick={() => handleBoothClick(booth)}
                      style={{ cursor: 'pointer' }}
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dy="0.3em"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </text>
                  </g>
                )
              })}
            </svg>
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
            <h3>Activity</h3>
            <p className="analytics-info">
              📍 Geolocation tracking enabled
              <br />
              {/* TODO: Display time spent at each booth */}
              Time per booth: --
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
