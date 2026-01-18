import React, { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import '../styles/Vector3D.css';

export default function Vector3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const { user } = useUser();
  const getProfileVectors = useAction(api.users.getProfileVectors);

  useEffect(() => {
    const fetchAndVisualize = async () => {
      try {
        const result = await getProfileVectors();
        if (result.success) {
          setProfiles(result.data);
          visualize3D(result.data);
        }
      } catch (error) {
        console.error('Error fetching vectors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndVisualize();
  }, [getProfileVectors]);

  const visualize3D = (data) => {
    if (!mountRef.current) return;

    const currentUserClerkId = user?.id;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = { scene, camera, renderer };

    // Add lights
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add XYZ axis helper - white and translucent
    const axisLength = 10;
    const axesMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      linewidth: 2
    });
    
    // X axis (white)
    const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xAxis = new THREE.Line(xAxisGeom, axesMaterial);
    scene.add(xAxis);
    
    // Y axis (white)
    const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    const yAxis = new THREE.Line(yAxisGeom, axesMaterial);
    scene.add(yAxis);
    
    // Z axis (white)
    const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength)
    ]);
    const zAxis = new THREE.Line(zAxisGeom, axesMaterial);
    scene.add(zAxis);

    // Create points from 3D coords
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    data.forEach((profile, idx) => {
      const [x, y, z] = profile.coords3d;
      const scaledX = x * 100;
      const scaledY = y * 100;
      const scaledZ = z * 100;
      
      // Scale up to fit in view (vectors are small values ~0.02 to 0.1)
      positions.push(scaledX, scaledY, scaledZ);
      
      // Color: green for current user, rainbow for others
      let color;
      if (profile.clerkId === currentUserClerkId) {
        color = new THREE.Color(0x00ff00); // Bright green for you
      } else {
        const hue = idx / Math.max(data.length, 1);
        color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      }
      colors.push(color.r, color.g, color.b);

      // Create line from origin to vector point with arrow
      const arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(scaledX, scaledY, scaledZ).normalize(),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(scaledX, scaledY, scaledZ).length(),
        color.getHex(),
        0.3,
        0.2
      );
      scene.add(arrowHelper);
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Remove labels - will show on click instead

    // Click detection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.5; // Increase click area around points
    const mouse = new THREE.Vector2();
    
    // Drag controls
    let isDragging = false;
    let hasDragged = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const onClick = (event) => {
      if (hasDragged) return; // Don't register clicks if we just dragged
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObject(points);
      if (intersects.length > 0) {
        const idx = intersects[0].index;
        const profile = data[idx];
        console.log('Clicked vector index:', idx, 'profile:', profile);
        setSelectedProfile(profile);
      }
    };
    
    const onMouseDown = (event) => {
      isDragging = true;
      hasDragged = false;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };
    
    const onMouseUp = () => {
      isDragging = false;
      // Reset hasDragged after a short delay to allow click event to fire
      setTimeout(() => { hasDragged = false; }, 100);
    };
    
    const onMouseMove = (event) => {
      if (isDragging) {
        // Drag to rotate camera
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        
        // Mark that we've moved (so click won't trigger)
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          hasDragged = true;
        }
        
        // Rotate camera around center
        const radius = Math.sqrt(
          camera.position.x ** 2 + 
          camera.position.y ** 2 + 
          camera.position.z ** 2
        );
        
        let theta = Math.atan2(camera.position.x, camera.position.z);
        let phi = Math.acos(camera.position.y / radius);
        
        theta -= deltaX * 0.01;
        phi -= deltaY * 0.01;
        
        // Clamp phi to avoid flipping
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
        
        camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(0, 0, 0);
        
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };
    
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('click', onClick);
      mountRef.current?.removeChild(renderer.domElement);
    };
  };

  return (
    <div ref={mountRef} className="vector-3d-container">
      {loading && <div className="loader">Loading vectors...</div>}
      <div className="info-panel">
        <h2>3D Vector Visualization</h2>
        <p>Profiles: {profiles.length}</p>
      </div>
      
      {selectedProfile && (
        <div className="profile-popup">
          <div className="popup-content">
            <button className="close-btn" onClick={() => setSelectedProfile(null)}>×</button>
            <h3>
              {selectedProfile.name}
              {selectedProfile.clerkId === user?.id && <span className="me-badge"> (You)</span>}
            </h3>
            <p><strong>Clerk ID:</strong> {selectedProfile.clerkId}</p>
            <p><strong>Coordinates:</strong> [{selectedProfile.coords3d.map(c => c.toFixed(4)).join(', ')}]</p>
          </div>
        </div>
      )}
    </div>
  );
}
