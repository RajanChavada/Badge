import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import useAppStore from '../store/useAppStore.js'
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useUser()
  const { userProfile } = useAppStore()
  const [stats, setStats] = useState({
    boothsVisited: 0,
    connectionsActive: 0,
    practiceChats: 0,
    targetCompanies: 0,
  })

  useEffect(() => {
    // TODO: Fetch analytics from Convex backend
    // Track booth visits, active connections, practice chat sessions, etc.
    setStats({
      boothsVisited: 0,
      connectionsActive: 0,
      practiceChats: 0,
      targetCompanies: userProfile?.targetSectors?.length || 0,
    })
  }, [userProfile])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p className="subtitle">
          {userProfile
            ? 'Your networking dashboard is ready'
            : 'Complete your profile to get started'}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon booths">
            <Target size={32} />
          </div>
          <div className="stat-content">
            <h3>Booths Visited</h3>
            <p className="stat-number">{stats.boothsVisited}</p>
            <span className="stat-label">today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon connections">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>Active Connections</h3>
            <p className="stat-number">{stats.connectionsActive}</p>
            <span className="stat-label">this event</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon chats">
            <BarChart3 size={32} />
          </div>
          <div className="stat-content">
            <h3>Practice Sessions</h3>
            <p className="stat-number">{stats.practiceChats}</p>
            <span className="stat-label">completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon targets">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <h3>Target Sectors</h3>
            <p className="stat-number">{stats.targetCompanies}</p>
            <span className="stat-label">selected</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <a href="/profile" className="action-button profile-action">
              <span className="action-icon">👤</span>
              <span className="action-text">Complete Profile</span>
            </a>
            <a href="/map" className="action-button map-action">
              <span className="action-icon">🗺️</span>
              <span className="action-text">Explore Booths</span>
            </a>
            <a href="/chat" className="action-button chat-action">
              <span className="action-icon">💬</span>
              <span className="action-text">Practice Pitch</span>
            </a>
            <button className="action-button settings-action">
              <span className="action-icon">⚙️</span>
              <span className="action-text">Settings</span>
            </button>
          </div>
        </section>

        <section className="recommendations">
          <h2>Recommended For You</h2>
          <div className="recommendations-list">
            {/* TODO: AI-generated recommendations based on resume and interests */}
            {userProfile ? (
              <div className="recommendation-item">
                <h3>Interested in {userProfile.targetRoles?.[0] || 'Software'} roles?</h3>
                <p>
                  Based on your profile, we recommend visiting booths from{' '}
                  {userProfile.targetSectors?.[0] || 'Tech'} companies.
                </p>
                <button className="btn-secondary">View Matches</button>
              </div>
            ) : (
              <div className="empty-state">
                <p>Complete your profile to see personalized recommendations</p>
                <a href="/profile" className="btn-primary">
                  Complete Profile
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
