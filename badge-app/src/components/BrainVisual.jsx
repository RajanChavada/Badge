import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import useAppStore from '../store/useAppStore.js'

export default function BrainVisual({ isRecording = false }) {
    const containerRef = useRef(null)
    const { darkMode } = useAppStore()

    // Refs to objects for dynamic updates
    const stateRef = useRef({
        brain: null,
        material: null,
        dots: null,
        dotsMat: null,
        clock: new THREE.Clock(),
        frameId: null
    })

    useEffect(() => {
        if (!containerRef.current) return

        // -- Setup --
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.z = 6 // Slightly further back for better perspective

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)

        // -- Create Objects --
        const geometry = new THREE.IcosahedronGeometry(3.2, 3) // Slightly larger
        const material = new THREE.MeshBasicMaterial({
            color: darkMode ? 0x667eea : 0x4285f4,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        })
        const brain = new THREE.Mesh(geometry, material)
        scene.add(brain)

        // Floating Depth Dots
        const dotsGeom = new THREE.BufferGeometry()
        const dotsCount = 400
        const posArray = new Float32Array(dotsCount * 3)
        for (let i = 0; i < dotsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 20
        }
        dotsGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
        const dotsMat = new THREE.PointsMaterial({
            size: 0.04,
            color: darkMode ? 0x888888 : 0x4285f4,
            transparent: true,
            opacity: 0.3
        })
        const dots = new THREE.Points(dotsGeom, dotsMat)
        scene.add(dots)

        stateRef.current.brain = brain
        stateRef.current.material = material
        stateRef.current.dots = dots
        stateRef.current.dotsMat = dotsMat

        // -- Animation Loop --
        const animate = () => {
            stateRef.current.frameId = requestAnimationFrame(animate)

            const elapsedTime = stateRef.current.clock.getElapsedTime()
            const speedMultiplier = isRecording ? 2.5 : 1.0

            // Faster rotation
            brain.rotation.y = elapsedTime * 0.15 * speedMultiplier
            brain.rotation.x = elapsedTime * 0.08 * speedMultiplier

            // Subtle counter-rotation for depth dots
            dots.rotation.y = -elapsedTime * 0.03

            // More pronounced Floating / Bobbing
            brain.position.y = Math.sin(elapsedTime * 0.6) * 0.3
            brain.position.x = Math.cos(elapsedTime * 0.4) * 0.2

            // Pulse the brain scale slightly
            const scalePulse = 1 + Math.sin(elapsedTime * 2) * 0.02
            brain.scale.setScalar(scalePulse * (isRecording ? 1.1 : 1.0))

            renderer.render(scene, camera)
        }
        animate()

        // -- Listeners --
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', handleResize)

        // -- Cleanup --
        return () => {
            if (stateRef.current.frameId) {
                cancelAnimationFrame(stateRef.current.frameId)
            }
            window.removeEventListener('resize', handleResize)
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            dotsGeom.dispose()
            dotsMat.dispose()
            renderer.dispose()
        }
    }, [darkMode, isRecording]) // Re-run when Recording state changes to update speed multiplier logic

    return (
        <div
            ref={containerRef}
            className="brain-visual-background"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1, // Changed from -1 to 1 to ensure it's above body background
                pointerEvents: 'none',
                background: 'transparent'
            }}
        />
    )
}
