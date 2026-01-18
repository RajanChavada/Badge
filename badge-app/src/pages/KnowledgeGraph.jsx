import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api.js'
import KnowledgeGraph3D from '../components/KnowledgeGraph3D.jsx'
import { graphManager } from '../utils/knowledgeGraphManager.js'
import useAppStore from '../store/useAppStore.js'
import './KnowledgeGraph.css'

const SPONSOR_BOOTHS = [
  {
    id: '1',
    name: 'Google',
    companyName: 'Google',
    description: 'Search & Cloud Solutions',
    color: 0x4285f4,
    tags: ['AI/ML', 'Cloud', 'Web Dev'],
    talkingPoints: 'Visit us to learn about our latest innovations in AI and cloud computing',
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
    color: 0x96be28,
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
    name: 'Microsoft',
    companyName: 'Microsoft',
    description: 'Cloud & AI Platform',
    color: 0x00a4ef,
    tags: ['Cloud', 'AI/ML', 'Enterprise'],
    talkingPoints: 'Discover career opportunities in cloud infrastructure and AI',
    keyPeople: [
      {
        id: 'p3',
        name: 'To be announced',
        role: 'TBA',
        company: 'Microsoft',
        bio: 'Connect with us at the booth',
        expertise: ['Cloud', 'AI/ML', 'Enterprise'],
      },
    ],
  },
  {
    id: '4',
    name: 'Meta',
    companyName: 'Meta',
    description: 'Social & VR',
    color: 0x1877f2,
    tags: ['Web Dev', 'Mobile Dev', 'VR/AR'],
    talkingPoints: 'Join us to explore the future of social and virtual reality',
    keyPeople: [
      {
        id: 'p4',
        name: 'To be announced',
        role: 'TBA',
        company: 'Meta',
        bio: 'Connect with us at the booth',
        expertise: ['Web Dev', 'Mobile Dev', 'VR/AR'],
      },
    ],
  },
]

export default function KnowledgeGraph() {
  const { user } = useUser()
  const { darkMode } = useAppStore()
  const userProfile = useQuery(api.users.getProfile, user?.id ? { clerkId: user.id } : 'skip')
  const boothStrategyAction = useAction(api.users.generateBoothApproachStrategy)
  const [selectedNode, setSelectedNode] = useState(null)
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [boothStrategies, setBoothStrategies] = useState(null)
  const [loadingStrategies, setLoadingStrategies] = useState(false)

  useEffect(() => {
    if (!user) return

    // Initialize graph manager
    graphManager.clear()

    // Add user node
    const userId = user.id
    graphManager.addUserNode({
      id: userId,
      name: user.fullName || 'You',
      email: user.primaryEmailAddress?.emailAddress || '',
      identity: userProfile?.identity || {},
    })

    // Add all booth nodes
    SPONSOR_BOOTHS.forEach((booth) => {
      graphManager.addBoothNode(booth)

      // Connect user to booth (generic connection)
      graphManager.addEdge(`user-${userId}`, `booth-${booth.id}`, 'can-visit', booth.color)

      // Connect user skills to booth if profile is loaded
      if (userProfile?.identity?.skills) {
        graphManager.connectSkillsToBooth(userId, booth.id, userProfile.identity.skills, booth.tags)
      }

      // Connect user interests to booth if profile is loaded
      if (userProfile?.identity?.interests) {
        graphManager.connectInterestsToBooth(userId, booth.id, userProfile.identity.interests, booth.tags)
      }
    })

    // Update graph data
    const nodes = graphManager.getNodes()
    const edges = graphManager.getEdges()
    
    console.log('Graph nodes:', nodes)
    console.log('Graph edges:', edges)
    
    setGraphData({
      nodes,
      edges,
    })
  }, [user, userProfile])

  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData)
    setBoothStrategies(null) // Clear any previous strategies when selecting a new node
    // Just show the modal, don't generate strategies yet
    if (nodeData.type === 'booth') {
      console.log('Booth selected:', nodeData)
    }
  }

  const handleGenerateBoothStrategy = async (booth) => {
    try {
      setLoadingStrategies(true)
      const strategies = await boothStrategyAction({
        userProfile: {
          name: userProfile.identity.headline || 'Student',
          headline: userProfile.identity.headline || '',
          skills: userProfile.identity.skills || [],
          interests: userProfile.identity.interests || [],
          education: userProfile.identity.education || [],
          experience: userProfile.identity.experience || [],
          goals: userProfile.identity.goals || [],
          targetRoles: userProfile.identity.targetRoles || [],
        },
        booth: {
          id: booth.id,
          name: booth.name,
          companyName: booth.companyName,
          description: booth.description,
          tags: booth.tags,
        },
      })
      setBoothStrategies(strategies)
      console.log('Booth strategies:', strategies)
    } catch (error) {
      console.error('Error generating booth strategies:', error)
      setBoothStrategies({
        keyStrategies: ['Error generating strategies. Please try again.'],
        whyGood: [],
        whatToAsk: [],
        preparation: [],
      })
    } finally {
      setLoadingStrategies(false)
    }
  }

  return (
    <div className={`knowledge-graph-page ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {graphData.nodes.length === 0 ? (
        <div className="loading-message">
          <p>Loading knowledge graph...</p>
        </div>
      ) : null}
      
      <KnowledgeGraph3D 
        nodes={graphData.nodes} 
        edges={graphData.edges} 
        onNodeClick={handleNodeClick}
        onGenerateBoothStrategy={handleGenerateBoothStrategy}
        loadingStrategies={loadingStrategies}
        sponsorBooths={SPONSOR_BOOTHS}
      />

      {selectedNode?.type === 'booth' && boothStrategies && (
        <div className="booth-strategies-overlay">
          <div className="booth-strategies-modal">
            <div className="booth-strategies-header">
              <h2>{selectedNode.name} Booth Approach</h2>
              <button 
                className="close-strategies-btn"
                onClick={() => {
                  setSelectedNode(null)
                  setBoothStrategies(null)
                }}
              >
                ✕
              </button>
            </div>

            <div className="booth-strategies-content">
              {loadingStrategies ? (
                <div className="strategies-loading">
                  <p>Generating personalized approach strategies...</p>
                </div>
              ) : !boothStrategies ? (
                <div className="strategies-empty">
                  <p>Click "Generate Strategy" to get personalized recommendations for approaching this booth.</p>
                </div>
              ) : (
                <>
                  {boothStrategies.keyStrategies && boothStrategies.keyStrategies.length > 0 && (
                    <div className="strategy-section">
                      <h3>Key Strategies</h3>
                      <ul>
                        {boothStrategies.keyStrategies.map((strategy, idx) => (
                          <li key={idx}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {boothStrategies.whyGood && boothStrategies.whyGood.length > 0 && (
                    <div className="strategy-section">
                      <h3>Why You're a Good Fit</h3>
                      <ul>
                        {boothStrategies.whyGood.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {boothStrategies.whatToAsk && boothStrategies.whatToAsk.length > 0 && (
                    <div className="strategy-section">
                      <h3>Questions to Ask</h3>
                      <ul>
                        {boothStrategies.whatToAsk.map((question, idx) => (
                          <li key={idx}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {boothStrategies.preparation && boothStrategies.preparation.length > 0 && (
                    <div className="strategy-section">
                      <h3>Preparation Steps</h3>
                      <ul>
                        {boothStrategies.preparation.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="graph-legend">
        <h4>Legend</h4>
        <ul>
          <li style={{ '--color': '#00ff88' }}>User Profile</li>
          <li style={{ '--color': '#4285f4' }}>Booth/Company</li>
          <li style={{ '--color': '#ffa500' }}>Skill</li>
          <li style={{ '--color': '#ff00ff' }}>Interest</li>
        </ul>
      </div>

      <div className="graph-help">
        <h4>Interact with the Graph</h4>
        <ul>
          <li><strong>Click</strong> on nodes to see details</li>
          <li><strong>Drag</strong> to rotate the view</li>
          <li><strong>Scroll</strong> to zoom in/out</li>
          <li><strong>Connections</strong> show matches between you and booths</li>
        </ul>
      </div>
    </div>
  )
}
