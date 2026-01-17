import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Navigation from './components/Navigation.js'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Map from './pages/Map.jsx'
import ChatInterface from './pages/ChatInterface.jsx'
import './App.css'

function App() {
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </SignedIn>
    </Router>
  )
}

export default App
