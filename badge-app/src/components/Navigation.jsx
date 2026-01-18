import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Home, Zap, MapPin, User, Moon, Sun, Box, Mic } from 'lucide-react'
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
            <Zap size={20} />
            <span>Knowledge Graph</span>
          </Link>
          <Link
            to="/live"
            className={`nav-link ${isActive('/live') ? 'active' : ''}`}
          >
            <Mic size={20} />
            <span>Live</span>
          </Link>
          <Link
            to="/vector-3d"
            className={`nav-link ${isActive('/vector-3d') ? 'active' : ''}`}
          >
            <Box size={20} />
            <span>Identity Graph</span>
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
