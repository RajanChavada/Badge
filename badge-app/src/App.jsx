import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Navigation from './components/Navigation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Map from './pages/Map.jsx'
import ChatInterface from './pages/ChatInterface.jsx'
import Vector3D from './pages/Vector3D.jsx'
import useAppStore from './store/useAppStore.js'
import './App.css'

function App() {
  const darkMode = useAppStore(state => state.darkMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <Router>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/map" element={<Map />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/vector-3d" element={<Vector3D />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </SignedIn>
    </Router>
  )
}

export default App
