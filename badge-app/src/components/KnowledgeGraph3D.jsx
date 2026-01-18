import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import './KnowledgeGraph3D.css'

export default function KnowledgeGraph3D({ nodes = [], edges = [], onNodeClick = () => {} }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const nodesRef = useRef({})
  const edgesRef = useRef([])
  const hoveredNodeRef = useRef(null)
  const sceneInitializedRef = useRef(false)
  const animationFrameIdRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)

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
    scene.background = new THREE.Color(0x0a0e27)
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
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    composer.addPass(bloomPass)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
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
      const geometry = new THREE.IcosahedronGeometry(3, 2)
      const material = new THREE.MeshStandardMaterial({
        color: node.color || 0x4285f4,
        metalness: 0.3,
        roughness: 0.4,
        emissive: node.color || 0x4285f4,
        emissiveIntensity: 0.2,
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
        data: node,
      }

      scene.add(mesh)

      nodesRef.current[node.id] = {
        mesh,
        position: mesh.position.clone(),
        originalColor: material.color.clone(),
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
          color: edge.color || 0x888888,
          linewidth: 1,
          transparent: true,
          opacity: 0.3,
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

      // Gentle rotation of nodes
      Object.values(nodesRef.current).forEach(node => {
        node.mesh.rotation.x += 0.001
        node.mesh.rotation.y += 0.002
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
      
      // Reset scene state
      sceneInitializedRef.current = false
      nodesRef.current = {}
      edgesRef.current = []
    }
  }, [nodes, edges, memoizedOnNodeClick])

  return (
    <div className="knowledge-graph-container">
      <div ref={containerRef} className="graph-canvas" />
      {selectedNode && (
        <div className="node-info-panel">
          <h3>{selectedNode.label}</h3>
          <p><strong>Type:</strong> {selectedNode.type}</p>
          {selectedNode.data.description && (
            <p><strong>Description:</strong> {selectedNode.data.description}</p>
          )}
          {selectedNode.data.tags && (
            <div className="tags">
              {selectedNode.data.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
