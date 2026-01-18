import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import '../styles/Vector3D.css';

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]
    const y = b[i]
    if (typeof x !== 'number' || typeof y !== 'number') return null
    dot += x * y
    normA += x * x
    normB += y * y
  }

  if (normA === 0 || normB === 0) return null
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export default function Vector3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();
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

    // Load star model
    // Helper function to create a star from procedural geometry
    const createStar = (position, color, size) => {
      const starGroup = new THREE.Group();
      starGroup.userData = {
        isAnimated: true,
        isStar: true,
        time: 0,
      };

      // Create star geometry (5-pointed star)
      const starShape = new THREE.Shape();
      const outerRadius = 1;
      const innerRadius = 0.4;
      const points = 5;
      
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.lineTo(Math.cos(-Math.PI / 2) * outerRadius, Math.sin(-Math.PI / 2) * outerRadius);

      // Extrude the star to give it depth
      const geometry = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3,
      });

      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.4,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(size, size, size);
      starGroup.add(mesh);

      starGroup.position.copy(position);
      return starGroup;
    };

    // Helper function to create an animated sphere
    const createAnimatedSphere = (position, color) => {
      const sphereGroup = new THREE.Group();
      sphereGroup.userData = {
        isAnimated: true,
        isStar: false,
        time: Math.random() * Math.PI * 2,
      };
      
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: new THREE.Color(color).multiplyScalar(0.5),
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      sphereGroup.add(mesh);
      
      sphereGroup.position.copy(position);
      
      return sphereGroup;
    };

    const animatedObjects = [];

    data.forEach((profile, idx) => {
      const [x, y, z] = profile.coords3d;
      const scaledX = x * 100;
      const scaledY = y * 100;
      const scaledZ = z * 100;
      const position = new THREE.Vector3(scaledX, scaledY, scaledZ);
      
      // Color: green for current user, rainbow for others
      let color;
      if (profile.clerkId === currentUserClerkId) {
        color = new THREE.Color(0x00ff00); // Bright green for you
      } else {
        const hue = idx / Math.max(data.length, 1);
        color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      }

      // Create star for current user, sphere for others
      if (profile.clerkId === currentUserClerkId) {
        const star = createStar(position, color.getHex(), 0.5);
        scene.add(star);
        animatedObjects.push(star);
      } else {
        const sphere = createAnimatedSphere(position, color.getHex());
        scene.add(sphere);
        animatedObjects.push(sphere);
      }

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

    // Remove labels - will show on click instead

    // Click detection
    const raycaster = new THREE.Raycaster();
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
      
      // Check intersections with animated objects (spheres and stars)
      const intersects = raycaster.intersectObjects(animatedObjects, true);
      if (intersects.length > 0) {
        // Find which profile this object belongs to
        const clickedObject = intersects[0].object.parent;
        const profileIdx = animatedObjects.indexOf(clickedObject);
        if (profileIdx >= 0 && profileIdx < data.length) {
          const profile = data[profileIdx];
          console.log('Clicked vector index:', profileIdx, 'profile:', profile);
          // Navigate to user profile page
          navigate(`/user/${profile.clerkId}`);
        }
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
      
      // Animate spheres and stars
      animatedObjects.forEach((obj) => {
        if (obj.userData.isAnimated) {
          obj.userData.time += 0.01;
          
          if (obj.userData.isStar) {
            // Star is static (no animation)
          } else {
            // Rotate spheres
            obj.rotation.x += 0.005;
            obj.rotation.y += 0.008;
            
            // Pulsing scale effect
            const scale = 1 + Math.sin(obj.userData.time) * 0.1;
            obj.scale.set(scale, scale, scale);
          }
        }
      });
      
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

  // Calculate similarity rankings
  const rankings = useMemo(() => {
    if (!user?.id || profiles.length === 0) return []

    const currentProfile = profiles.find(p => p.clerkId === user.id)
    if (!currentProfile || !currentProfile.vector) return []

    const others = profiles.filter(p => p.clerkId !== user.id)
    const ranked = others
      .map(p => {
        // Find original index to get the same color as in 3D view
        const originalIdx = profiles.findIndex(prof => prof.clerkId === p.clerkId)
        const hue = originalIdx / Math.max(profiles.length, 1)
        const color = `hsl(${hue * 360}, 80%, 60%)`
        
        return {
          ...p,
          similarity: cosineSimilarity(currentProfile.vector, p.vector) || 0,
          color: color
        }
      })
      .sort((a, b) => b.similarity - a.similarity)

    return ranked
  }, [profiles, user?.id])

  return (
    <div className="vector-3d-page">
      <div className="split-container">
        {/* Left side: 3D Visualization */}
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

        {/* Right side: Similarity Ranking */}
        <div className="similarity-panel">
          <div className="similarity-header">
            <h2>Similarity Ranking</h2>
            <p>Cosine similarity to your profile</p>
          </div>

          {loading ? (
            <div className="loader">Loading...</div>
          ) : rankings.length === 0 ? (
            <div className="empty-state">No other profiles to compare</div>
          ) : (
            <div className="similarity-content">
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-label">Top Match</span>
                  <span className="stat-value">{rankings[0]?.name || 'Unknown'}</span>
                  <span className="stat-detail">{(rankings[0]?.similarity * 100).toFixed(1)}% similar</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{rankings.length}</span>
                </div>
              </div>

              <div className="rankings-list">
                {rankings.slice(0, 10).map((profile, idx) => (
                  <div 
                    key={profile.clerkId} 
                    className="ranking-item"
                    onClick={() => navigate(`/user/${profile.clerkId}`)}
                  >
                    <div className="rank-number" style={{ color: profile.color }}>#{idx + 1}</div>
                    <div className="rank-info">
                      <div className="rank-name">{profile.name || 'Unknown'}</div>
                      <div className="rank-id">{profile.clerkId}</div>
                    </div>
                    <div className="rank-similarity">
                      <div className="similarity-bar">
                        <div 
                          className="similarity-fill" 
                          style={{ 
                            width: `${profile.similarity * 100}%`,
                            background: profile.color
                          }}
                        ></div>
                      </div>
                      <span className="similarity-text" style={{ color: profile.color }}>
                        {(profile.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
