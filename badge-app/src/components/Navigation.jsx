import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Home, MapPin, MessageCircle, User, Moon, Sun, Box, BarChart3 } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import './Navigation.css'

export default function Navigation() {
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useAppStore()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">🎯</span>
          <span className="brand-text">Badge</span>
        </Link>

        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          >
            <User size={20} />
            <span>Profile</span>
          </Link>
          <Link
            to="/map"
            className={`nav-link ${isActive('/map') ? 'active' : ''}`}
          >
            <MapPin size={20} />
            <span>Map</span>
          </Link>
          <Link
            to="/chat"
            className={`nav-link ${isActive('/chat') ? 'active' : ''}`}
          >
            <MessageCircle size={20} />
            <span>Chat</span>
          </Link>
          <Link
            to="/vector-3d"
            className={`nav-link ${isActive('/vector-3d') ? 'active' : ''}`}
          >
            <Box size={20} />
            <span>3D Vectors</span>
          </Link>
          <Link
            to="/similarity"
            className={`nav-link ${isActive('/similarity') ? 'active' : ''}`}
          >
            <BarChart3 size={20} />
            <span>Similarity</span>
          </Link>
        </div>

        <div className="user-menu">
          <button 
            className="dark-mode-toggle" 
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
