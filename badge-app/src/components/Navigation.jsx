import { Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { Home, Zap, MessageCircle, User } from 'lucide-react'
import './Navigation.css'

export default function Navigation() {
  const location = useLocation()

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
            to="/chat"
            className={`nav-link ${isActive('/chat') ? 'active' : ''}`}
          >
            <MessageCircle size={20} />
            <span>Chat</span>
          </Link>
          <Link
            to="/knowledge-graph"
            className={`nav-link ${isActive('/knowledge-graph') ? 'active' : ''}`}
          >
            <Zap size={20} />
            <span>Graph</span>
          </Link>
        </div>

        <div className="user-menu">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
