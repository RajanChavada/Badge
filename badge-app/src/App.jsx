import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Navigation from './components/Navigation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import KnowledgeGraph from './pages/KnowledgeGraph.jsx'
import ChatInterface from './pages/ChatInterface.jsx'
import Vector3D from './pages/Vector3D.jsx'
import SimilarityRanking from './pages/SimilarityRanking.jsx'
import UserProfile from './pages/UserProfile.jsx'
import useAppStore from './store/useAppStore.js'
import './App.css'
import LiveConversation from './pages/LiveConversation.jsx'






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
              <Route path="/map" element={<KnowledgeGraph />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/live" element={<LiveConversation />} />
              <Route path="/vector-3d" element={<Vector3D />} />
              <Route path="/similarity" element={<SimilarityRanking />} />
              <Route path="/user/:clerkId" element={<UserProfile />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </SignedIn>
    </Router>
  )
}

export default App
