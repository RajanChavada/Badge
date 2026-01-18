import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import useAppStore from '../store/useAppStore.js'
import './KnowledgeGraph3D.css'

export default function KnowledgeGraph3D({ nodes = [], edges = [], onNodeClick = () => {}, onGenerateBoothStrategy, loadingStrategies = false, sponsorBooths = [] }) {
  const { darkMode } = useAppStore()
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const nodesRef = useRef({})
  const edgesRef = useRef([])
  const hoveredNodeRef = useRef(null)
  const sceneInitializedRef = useRef(false)
  const animationFrameIdRef = useRef(null)
  const labelsContainerRef = useRef(null)
  const labelsRef = useRef({})
  const animationTimeRef = useRef(0)
  const showLabelsRef = useRef(true)
  const showBobbingRef = useRef(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [showLabels, setShowLabels] = useState(true)
  const [showBobbing, setShowBobbing] = useState(true)

  // Update refs when state changes
  useEffect(() => {
    showLabelsRef.current = showLabels
  }, [showLabels])

  useEffect(() => {
    showBobbingRef.current = showBobbing
  }, [showBobbing])

  // Memoize the onNodeClick callback
  const memoizedOnNodeClick = useCallback(onNodeClick, [])

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    // Clean up previous scene if nodes have changed
    if (sceneInitializedRef.current && sceneRef.current) {
      // Only skip reinitializing if scene exists AND has the same number of nodes
      if (nodesRef.current && Object.keys(nodesRef.current).length === nodes.length) {
        return
      }
      
      // Otherwise, clean up the old scene
      if (rendererRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      sceneInitializedRef.current = false
    }

    console.log('Rendering graph with nodes:', nodes)

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(darkMode ? 0x1a1a1a : 0xf5f5f5)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
    camera.position.set(0, 0, 100)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Post-processing with bloom
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,  // strength
      0.2,  // radius
      0.95  // threshold
    )
    composer.addPass(bloomPass)

    // Create labels container
    if (!labelsContainerRef.current) {
      labelsContainerRef.current = document.createElement('div')
      labelsContainerRef.current.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      `
      containerRef.current.appendChild(labelsContainerRef.current)
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    pointLight.position.set(50, 50, 50)
    pointLight.castShadow = true
    scene.add(pointLight)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = false

    // Raycaster for interactions
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Create nodes
    const nodesByPosition = {}
    
    nodes.forEach((node, idx) => {
      // Create visible geometry
      const geometry = new THREE.IcosahedronGeometry(6, 3)
      const material = new THREE.MeshStandardMaterial({
        color: node.color || 0x667eea,
        metalness: 0.1,
        roughness: 0.6,
        emissive: node.color || 0x667eea,
        emissiveIntensity: 0.6,
      })

      const mesh = new THREE.Mesh(geometry, material)
      
      // Position nodes in a sphere
      const phi = Math.acos(-1 + (2 * idx) / nodes.length)
      const theta = Math.sqrt(nodes.length * Math.PI) * phi
      const radius = 60

      mesh.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      )

      mesh.userData = {
        id: node.id,
        label: node.label,
        type: node.type,
        ...node.data,
      }

      scene.add(mesh)

      // Create label for node
      const label = document.createElement('div')
      label.textContent = node.label
      label.style.cssText = `
        position: absolute;
        background-color: rgba(102, 126, 234, 0.9);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 10;
        transition: all 0.2s ease;
      `
      labelsContainerRef.current.appendChild(label)
      labelsRef.current[node.id] = { label, mesh }

      nodesRef.current[node.id] = {
        mesh,
        position: mesh.position.clone(),
        originalColor: material.color.clone(),
        // Random phase offsets for independent bobbing
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
      }
      nodesByPosition[node.id] = mesh.position
    })

    // Create edges (connections between nodes)
    edges.forEach((edge) => {
      const start = nodesByPosition[edge.source]
      const end = nodesByPosition[edge.target]

      if (start && end) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(
          new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]),
          3
        ))

        const material = new THREE.LineBasicMaterial({
          color: edge.color || 0x999999,
          linewidth: 2,
          transparent: true,
          opacity: 0.5,
        })

        const line = new THREE.Line(geometry, material)
        scene.add(line)
        edgesRef.current.push(line)
      }
    })

    // Mouse interaction
    const onMouseClick = (event) => {
      if (event.target !== renderer.domElement) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const meshArray = Object.values(nodesRef.current).map(n => n.mesh)
      const intersects = raycaster.intersectObjects(meshArray)

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object
        console.log('Node clicked:', clickedMesh.userData)
        setSelectedNode(clickedMesh.userData)
        memoizedOnNodeClick(clickedMesh.userData)
      } else {
        setSelectedNode(null)
      }
    }

    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const meshArray = Object.values(nodesRef.current).map(n => n.mesh)
      const intersects = raycaster.intersectObjects(meshArray)

      // Reset previous hover
      if (hoveredNodeRef.current) {
        hoveredNodeRef.current.scale.set(1, 1, 1)
        hoveredNodeRef.current.material.emissiveIntensity = 0.2
      }

      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object
        hoveredMesh.scale.set(1.3, 1.3, 1.3)
        hoveredMesh.material.emissiveIntensity = 1.0  // Increased for glow effect
        hoveredNodeRef.current = hoveredMesh
        renderer.domElement.style.cursor = 'pointer'
      } else {
        hoveredNodeRef.current = null
        renderer.domElement.style.cursor = 'default'
      }
    }

    renderer.domElement.addEventListener('click', onMouseClick)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate)
      controls.update()
      
      animationTimeRef.current += 0.016 // ~60fps

      // Gentle rotation of nodes
      Object.values(nodesRef.current).forEach(node => {
        node.mesh.rotation.x += 0.001
        node.mesh.rotation.y += 0.002
        
        // Add bobbing motion in random directions when enabled
        if (showBobbingRef.current) {
          const bobAmount = 2
          const time = animationTimeRef.current
          // Each node bobs independently using its random phase offsets
          node.mesh.position.x = node.position.x + Math.sin(time * 1.5 + node.phaseX) * bobAmount * 0.6
          node.mesh.position.y = node.position.y + Math.cos(time * 1.3 + node.phaseY) * bobAmount * 0.6
          node.mesh.position.z = node.position.z + Math.sin(time * 1.1 + node.phaseZ) * bobAmount * 0.8
        } else {
          // Reset to original position if bobbing is disabled
          node.mesh.position.copy(node.position)
        }
      })

      // Update label positions to follow nodes
      Object.entries(labelsRef.current).forEach(([nodeId, { label, mesh }]) => {
        const vector = mesh.position.clone()
        vector.project(camera)
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth
        const y = -(vector.y * 0.5 - 0.5) * window.innerHeight
        
        label.style.left = (x - label.offsetWidth / 2) + 'px'
        label.style.top = (y - 30) + 'px'
        
        // Hide labels that are behind the camera or if labels are disabled
        label.style.opacity = (vector.z > 1 || !showLabelsRef.current) ? '0' : '1'
      })

      composer.render()
    }

    animate()

    // Mark scene as initialized
    sceneInitializedRef.current = true

    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onWindowResize)

    return () => {
      // Cancel animation frame
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }

      window.removeEventListener('resize', onWindowResize)
      renderer.domElement.removeEventListener('click', onMouseClick)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      
      // Clear labels
      if (labelsContainerRef.current && containerRef.current && containerRef.current.contains(labelsContainerRef.current)) {
        containerRef.current.removeChild(labelsContainerRef.current)
        labelsContainerRef.current = null
      }
      labelsRef.current = {}
      
      // Reset scene state
      sceneInitializedRef.current = false
      nodesRef.current = {}
      edgesRef.current = []
    }
  }, [nodes, edges, memoizedOnNodeClick, darkMode])

  return (
    <div className={`knowledge-graph-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div ref={containerRef} className="graph-canvas" />
      
      {/* Toggle buttons */}
      <div className="graph-controls">
        <button 
          className={`toggle-btn ${showLabels ? 'active' : ''}`}
          onClick={() => setShowLabels(!showLabels)}
          title="Toggle node labels"
        >
          {showLabels ? '🏷️ Labels ON' : '🏷️ Labels OFF'}
        </button>
        <button 
          className={`toggle-btn ${showBobbing ? 'active' : ''}`}
          onClick={() => setShowBobbing(!showBobbing)}
          title="Toggle node bobbing animation"
        >
          {showBobbing ? '🎈 Bobbing ON' : '🎈 Bobbing OFF'}
        </button>
      </div>
      
      {selectedNode && (
        <div className="node-info-panel">
          <h3>{selectedNode.label}</h3>
          <p><strong>Type:</strong> {selectedNode.type}</p>
          {selectedNode.description && (
            <p><strong>Description:</strong> {selectedNode.description}</p>
          )}
          {selectedNode.talkingPoints && (
            <p><strong>Talking Points:</strong> {selectedNode.talkingPoints}</p>
          )}
          {selectedNode.tags && selectedNode.tags.length > 0 && (
            <div>
              <p style={{ marginBottom: '0.5rem' }}><strong>Focus Areas:</strong></p>
              <div className="tags">
                {selectedNode.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {selectedNode.keyPeople && selectedNode.keyPeople.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Key People:</strong></p>
              {selectedNode.keyPeople.map((person) => (
                <div key={person.id} style={{ marginLeft: '0.5rem', marginBottom: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0' }}><strong>{person.name}</strong> - {person.role}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85em' }}>{person.bio}</p>
                  {person.expertise && person.expertise.length > 0 && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85em' }}>Expertise: {person.expertise.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {selectedNode.type === 'booth' && onGenerateBoothStrategy && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <button
                className="btn-node-generate-strategy"
                onClick={() => {
                  // Extract booth ID from the selectedNode id (format: "booth-1", "booth-2", etc.)
                  const boothId = selectedNode.id.split('-')[1]
                  // Find the booth in sponsorBooths array
                  const booth = sponsorBooths.find(b => b.id === boothId)
                  if (booth) {
                    onGenerateBoothStrategy(booth)
                  }
                }}
                disabled={loadingStrategies}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  cursor: loadingStrategies ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '1.05em',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  opacity: loadingStrategies ? 0.65 : 1,
                  transform: 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (!loadingStrategies) {
                    e.target.style.transform = 'translateY(-3px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingStrategies) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {loadingStrategies ? '⟳ Generating...' : '⟳ Generate Strategy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
