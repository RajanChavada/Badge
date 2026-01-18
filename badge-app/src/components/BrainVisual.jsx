import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import useAppStore from '../store/useAppStore.js'

export default function BrainVisual({ isRecording = false }) {
    const containerRef = useRef(null)
    const { darkMode } = useAppStore()

    // Core refs to preserve state
    const sceneRef = useRef(null)
    const rendererRef = useRef(null)
    const cameraRef = useRef(null)
    const objectsRef = useRef({
        brainGroup: null,
        sphere: null,
        innerSphere: null,
        particles: null
    })
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const animationFrameId = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return

        // -- Setup --
        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.z = 5
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // -- Create Brain Visual --
        const brainGroup = new THREE.Group()

        // Outer Sphere
        const geometry = new THREE.IcosahedronGeometry(2.5, 3)
        const material = new THREE.MeshBasicMaterial({
            color: darkMode ? 0x667eea : 0x4285f4,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        })
        const sphere = new THREE.Mesh(geometry, material)

        // Inner Sphere
        const innerGeom = new THREE.IcosahedronGeometry(1.6, 2)
        const innerMat = new THREE.MeshBasicMaterial({
            color: darkMode ? 0x9f7aea : 0x4285f4,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        })
        const innerSphere = new THREE.Mesh(innerGeom, innerMat)

        brainGroup.add(sphere)
        brainGroup.add(innerSphere)
        scene.add(brainGroup)

        // Particles
        const partGeom = new THREE.BufferGeometry()
        const count = 400
        const posArray = new Float32Array(count * 3)
        for (let i = 0; i < count * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15
        }
        partGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
        const partMat = new THREE.PointsMaterial({
            size: 0.04,
            color: darkMode ? 0xffffff : 0x667eea,
            transparent: true,
            opacity: 0.4
        })
        const particles = new THREE.Points(partGeom, partMat)
        scene.add(particles)

        objectsRef.current = { brainGroup, sphere, innerSphere, particles }

        // -- Mouse Listener --
        const onMouseMove = (e) => {
            mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
            mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('mousemove', onMouseMove)

        const onResize = () => {
            if (!containerRef.current) return
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', onResize)

        // -- Animation Loop --
        let lastTime = 0
        const animate = (time) => {
            animationFrameId.current = requestAnimationFrame(animate)

            const delta = time - lastTime
            lastTime = time

            // Constant rotation
            brainGroup.rotation.y += 0.005
            particles.rotation.y -= 0.001

            // Smother mouse follow
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

            brainGroup.rotation.x = mouseRef.current.y * 0.3
            brainGroup.rotation.z = -mouseRef.current.x * 0.2

            // Breathing
            const pulse = 1 + Math.sin(time * 0.002) * 0.04
            sphere.scale.setScalar(pulse)
            innerSphere.scale.setScalar(pulse * 0.9)

            renderer.render(scene, camera)
        }
        animate(0)

        // -- Cleanup --
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            cancelAnimationFrame(animationFrameId.current)
            if (renderer.domElement && containerRef.current) {
                containerRef.current.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            innerGeom.dispose()
            innerMat.dispose()
            partGeom.dispose()
            partMat.dispose()
            renderer.dispose()
        }
    }, [darkMode])

    // Update colors based on recording state without re-mounting
    useEffect(() => {
        const { sphere, particles } = objectsRef.current
        if (!sphere || !particles) return

        const targetColor = isRecording ? 0xff4d4d : (darkMode ? 0x667eea : 0x4285f4)
        const targetOpacity = isRecording ? 0.4 : 0.15

        sphere.material.color.setHex(targetColor)
        sphere.material.opacity = targetOpacity

        particles.material.color.setHex(isRecording ? 0xff4d4d : (darkMode ? 0xffffff : 0x667eea))
        particles.material.opacity = isRecording ? 0.7 : 0.4
    }, [isRecording, darkMode])

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
                zIndex: -1, // ALWAYS BEHIND CONTENT
                pointerEvents: 'none',
                opacity: 0.9,
                background: 'transparent'
            }}
        />
    )
}
