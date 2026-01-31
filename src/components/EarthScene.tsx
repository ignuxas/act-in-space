'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useLoader, extend } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import * as satellite from 'satellite.js'
import { gnssTLEs } from '@/lib/tleData'

// --- Constants ---
const EARTH_RADIUS_KM = 6371;
const SCENE_EARTH_RADIUS = 2;
const SCALE = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM;

// --- Helper Functions ---

function createCircleTexture() {
  if (typeof document === 'undefined') return new THREE.Texture(); 
  
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function eciToThree(eci: satellite.EciVec3<number>) {
    // Apply 0.6x factor to visually pull satellites closer to Earth surface
    const visualScale = SCALE * 0.6;
    return new THREE.Vector3(
        eci.x * visualScale,
        eci.z * visualScale, // North
        -eci.y * visualScale 
    )
}

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180) - Math.PI/2 
  const x = -(radius) * Math.sin(phi) * Math.cos(theta)
  const z = (radius) * Math.sin(phi) * Math.sin(theta)
  const y = (radius) * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

// --- Shaders ---

// 1. Surface Pattern (Elliptical Iso-Doppler Lines) - Mimics Fig 2/3
const surfaceVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const surfaceFragmentShader = `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 center = vec2(0.5);
  vec2 pos = vUv - center;
  
  // Elliptical Distortions
  float dist = length(pos * vec2(1.0, 1.6));
  
  // Remove hard disk edge - fade out softly
  if (dist > 0.5) discard;

  // Concentric Iso-Doppler Lines (Very thin, technical)
  float rings = sin(dist * 80.0 - uTime * 0.5);
  float pattern = smoothstep(0.95, 0.98, rings); // Extremely thin lines
  
  // Composite technical grid
  float lines = pattern;
  
  // Professional Palette: Cyan/Blue (ESA/NASA style)
  vec3 colorUser = vec3(0.0, 0.8, 1.0); // Cyan
  
  // Only render lines, no background fill (transparent void)
  float alpha = lines * (1.0 - smoothstep(0.2, 0.5, dist)) * 0.8;
  
  gl_FragColor = vec4(colorUser, alpha);
}
`

// 2. 3D Correlation Peaks (The "Heatmap" Popup) - Mimics Fig 4A
const peakVertexShader = `
uniform float uTime;
varying float vElevation;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Distance from center
  vec2 center = vec2(0.5);
  float d = distance(uv, center);
  
  // Generate "Mountain Peaks" (Correlation Function)
  // Main centralized correlation peak
  float peak = exp(-d * 5.0) * cos(d * 10.0 - uTime * 2.0);
  
  // Secondary side lobes
  float lobes = sin(uv.x * 20.0) * cos(uv.y * 20.0) * exp(-d * 3.0) * 0.3;
  
  float elevation = (peak + lobes) * 0.5;
  if (elevation < 0.0) elevation = 0.0; // Clamp bottom
  
  vElevation = elevation;
  
  pos.z += elevation * 0.8; // Displace vertex up (Z is up in PlaneGeometry)
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const peakFragmentShader = `
varying float vElevation;
varying vec2 vUv;

void main() {
  // Color map based on elevation (Heatmap style: Blue -> Green -> Red)
  vec3 low = vec3(0.0, 0.0, 0.5); // Deep Blue
  vec3 mid = vec3(0.0, 1.0, 0.0); // Green
  vec3 high = vec3(1.0, 0.0, 0.0); // Red
  
  float t = smoothstep(0.0, 0.4, vElevation);
  vec3 color = mix(low, mid, t * 2.0);
  if (t > 0.5) color = mix(mid, high, (t - 0.5) * 2.0);
  
  // Grid lines on the graph (wireframe look overlay)
  float grid = max(
    step(0.95, fract(vUv.x * 20.0)),
    step(0.95, fract(vUv.y * 20.0))
  );
  
  vec3 finalColor = mix(color, vec3(1.0), grid * 0.2);
  
  gl_FragColor = vec4(finalColor, 0.9);
}
`

// --- Components ---

function TexturedEarth() {
   const [colorMap] = useLoader(THREE.TextureLoader, [
       'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'       
   ])
   
   return (
       <mesh>
           <sphereGeometry args={[SCENE_EARTH_RADIUS, 48, 48]} />
           <meshPhongMaterial
              map={colorMap} 
              shininess={15}
              specular={new THREE.Color(0x222222)}
           />
       </mesh>
   )
}

function AtmosphereGlow() {
    return (
        <group>
            {/* Inner Glow */}
            <mesh>
                <sphereGeometry args={[SCENE_EARTH_RADIUS * 1.04, 64, 64]} />
                <meshBasicMaterial 
                    color={0x4499ff}
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            {/* Outer Glow */}
             <mesh>
                <sphereGeometry args={[SCENE_EARTH_RADIUS * 1.075, 64, 64]} />
                <meshBasicMaterial 
                    color={0x2266ff}
                    transparent
                    opacity={0.08}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}

function StarField() {
    const { positions, sizes, colors, texture } = useMemo(() => {
        const count = 1000; // Reduced star count for cleaner look
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        const tex = createCircleTexture();
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            
            let d = Math.sqrt(x*x + y*y + z*z);
            let fx = x, fy = y, fz = z;
            if (d < 15) {
               fx = x * (16/d); fy = y * (16/d); fz = z * (16/d); 
            }

            positions[i*3] = fx;
            positions[i*3+1] = fy;
            positions[i*3+2] = fz;

            sizes[i] = Math.random() * 1.2 + 0.4;
            
            const color = new THREE.Color();
            const hue = Math.random() < 0.7 ? 0.6 : 0.15;
            color.setHSL(hue, 0.05 + Math.random() * 0.15, 0.85 + Math.random() * 0.15);
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
        }

        return { positions, sizes, colors, texture: tex };
    }, []);
    
    const pointsRef = useRef<THREE.Points>(null);
    useFrame(() => {
        if (pointsRef.current) pointsRef.current.rotation.y += 0.0001;
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
                <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
            </bufferGeometry>
            {texture && (
                <pointsMaterial 
                    size={0.12}
                    vertexColors
                    transparent
                    opacity={1.0}
                    sizeAttenuation
                    map={texture}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            )}
        </points>
    )
}

function HeatmapIndicator({ position }: { position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null)
  const surfaceMatRef = useRef<THREE.ShaderMaterial>(null)
  const peakMatRef = useRef<THREE.ShaderMaterial>(null)
  
  // Interaction State
  const { isAnalysisOpen, setAnalysisOpen } = useStore()
  
  // FIX: Stable Uniforms (Defined at top level)
  const surfaceUniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const peakUniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  
  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.lookAt(new THREE.Vector3(0,0,0));
    }
    const t = state.clock.getElapsedTime();
    if (surfaceMatRef.current) surfaceMatRef.current.uniforms.uTime.value = t;
    if (peakMatRef.current) peakMatRef.current.uniforms.uTime.value = t;
  })

  return (
    <group position={position} ref={groupRef}>
        
        {/* 1. Surface Projection (Fig 2: Iso-Doppler Lines) */}
        <mesh 
            position={[0,0,0.02]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              setAnalysisOpen(!isAnalysisOpen); 
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <planeGeometry args={[1.0, 1.0]} />
            <shaderMaterial 
                ref={surfaceMatRef}
                vertexShader={surfaceVertexShader}
                fragmentShader={surfaceFragmentShader}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={surfaceUniforms}
            />
        </mesh>

        {/* 2. Target Label (Removed as requested) */}
        
        {/* 3. POPUP: 3D Correlation Peaks (Fig 4A) */}
        {isAnalysisOpen && (
            <group position={[0, 0, 1.5]} rotation={[-Math.PI/2, 0, 0]}>
                 {/* The 3D Graph Mesh */}
                 <mesh>
                    <planeGeometry args={[2, 2, 64, 64]} />
                    <shaderMaterial
                        ref={peakMatRef}
                        vertexShader={peakVertexShader}
                        fragmentShader={peakFragmentShader}
                        transparent
                        side={THREE.DoubleSide}
                        blending={THREE.NormalBlending}
                        uniforms={peakUniforms}
                    />
                 </mesh>
                 
                 {/* Graph Frame/Box */}
                 <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 0.5)]} />
                    <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
                 </lineSegments>
            </group>
        )}
    </group>
  )
}

function OrbitsAndSatellites({ targetWorldPos }: { targetWorldPos: THREE.Vector3 | null }) {
    const [systems, setSystems] = useState<any[]>([])
    const pointsRef = useRef<THREE.Points>(null)
    const [signals, setSignals] = useState<{satPos: THREE.Vector3, targetPos: THREE.Vector3}[]>([])
    
    // Create the soft glow texture
    const texture = useMemo(() => createCircleTexture(), [])

    useEffect(() => {
        const now = new Date()
        const calculatedSystems = gnssTLEs.map(tle => {
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
            const periodMins = 720; 
            const points: THREE.Vector3[] = []
            
            for (let i = 0; i <= periodMins; i += 5) {
                const t = new Date(now.getTime() + i * 60000)
                const pv = satellite.propagate(satrec, t)
                if (pv.position && typeof pv.position !== 'boolean') {
                    const p = pv.position as satellite.EciVec3<number>
                    points.push(eciToThree(p))
                }
            }
            return { tle, satrec, points }
        })
        setSystems(calculatedSystems)
    }, [])

    const { positions, colors } = useMemo(() => {
        if (systems.length === 0) return { positions: new Float32Array(0), colors: new Float32Array(0) }
        const count = systems.length
        const pos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)
        
        // Pale blue color for satellites
        const color = new THREE.Color(0xaaccff) 
        
        for(let i=0; i<count; i++) {
            col[i*3] = color.r;
            col[i*3+1] = color.g;
            col[i*3+2] = color.b;
        }
        return { positions: pos, colors: col }
    }, [systems.length])

    useFrame(() => {
        if (!pointsRef.current || systems.length === 0) return
        
        const now = new Date()
        const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array
        
        const activeSats: {pos: THREE.Vector3, targetPos: THREE.Vector3, dist: number, index: number}[] = []

        // 1. Update all satellite positions based on TLE
        systems.forEach((sys, i) => {
            const pv = satellite.propagate(sys.satrec, now)
            if (pv.position && typeof pv.position !== 'boolean') {
                const pos = eciToThree(pv.position as satellite.EciVec3<number>)
                
                // Default: Show at real position
                currentPositions[i*3] = pos.x
                currentPositions[i*3+1] = pos.y
                currentPositions[i*3+2] = pos.z
                
                // If we have a target, we need to calculate distances to find the best 2
                if (targetWorldPos) {
                    const dist = pos.distanceTo(targetWorldPos)
                    activeSats.push({ pos: pos.clone(), targetPos: targetWorldPos.clone(), dist, index: i })
                }
            } else {
                // If propagation fails, hide
                currentPositions[i*3] = 0; currentPositions[i*3+1] = 0; currentPositions[i*3+2] = 0;
            }
        })

        const newSignals: {satPos: THREE.Vector3, targetPos: THREE.Vector3}[] = []

        // 2. CONDITIONAL DISPLAY LOGIC
        if (targetWorldPos) {
            // Mode: THREAT SELECTED -> Show only top 2, modified visuals
            activeSats.sort((a, b) => a.dist - b.dist);
            const top2 = activeSats.slice(0, 2);
            
            // First, HIDE ALL (Move to center of earth)
            for(let i=0; i<systems.length; i++) {
                currentPositions[i*3] = 0; currentPositions[i*3+1] = 0; currentPositions[i*3+2] = 0;
            }

            // Now show and position the top 2
            top2.forEach((sat, idx) => {
                let visualPos = sat.pos.clone();

                if (idx === 0) {
                    // FORCE LEO ALTITUDE for the "Receiver"
                    visualPos.normalize().multiplyScalar(SCENE_EARTH_RADIUS * 1.25);
                } else {
                    if (visualPos.length() < SCENE_EARTH_RADIUS * 2.5) {
                        visualPos.normalize().multiplyScalar(SCENE_EARTH_RADIUS * 3.5);
                    }
                }
                
                // Update buffer for visible ones
                currentPositions[sat.index*3] = visualPos.x
                currentPositions[sat.index*3+1] = visualPos.y
                currentPositions[sat.index*3+2] = visualPos.z
                
                newSignals.push({ satPos: visualPos, targetPos: sat.targetPos })
            })
        }
        // Mode: NO THREAT -> All satellites visible at real positions (already set in step 1 loop)

        setSignals(newSignals)
        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <group>
            {systems.map((sys, i) => (
                <Line
                    key={`orbit-${i}`}
                    points={sys.points}
                    color="#004466" 
                    lineWidth={1}
                    transparent
                    opacity={0.15} 
                />
            ))}

            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial 
                    map={texture}
                    size={0.5} // Large size (approx 1.0 visual scale)
                    sizeAttenuation
                    vertexColors
                    transparent
                    opacity={1.0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {signals.map((sig, i) => (
                <Line
                    key={`sig-${i}`}
                    points={[sig.satPos, sig.targetPos]}
                    color="#00ff88" 
                    lineWidth={1}
                    transparent
                    opacity={0.8}
                    dashed
                    dashScale={10}
                    dashSize={0.4}
                    gapSize={0.2}
                />
            ))}
        </group>
    )
}

function SceneContent() {
    const earthGroup = useRef<THREE.Group>(null)
    const [targetWorldPos, setTargetWorldPos] = useState<THREE.Vector3 | null>(null)
    const { addAlert, alerts, selectedAlertId } = useStore()
    
    // Initialize Threats
    useEffect(() => {
        // Clear existing alerts to prevent duplicates on hot reload if needed, but 'addAlert' appends.
        // We'll just add them once.
        const t1 = setTimeout(() => addAlert("Unidentified Wake: South Pacific", "warning", { lat: -48.9, lon: -123.4 }), 1000)
        const t2 = setTimeout(() => addAlert("Kelvin Wake Trace: Baltic Sea", "critical", { lat: 55.0, lon: 20.0 }), 3000)
        const t3 = setTimeout(() => addAlert("Surface Texture Anomaly: Black Sea", "critical", { lat: 43.0, lon: 35.0 }), 5000)
        
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }
    }, [addAlert])

    useFrame(() => {
        if (earthGroup.current) {
            earthGroup.current.rotation.y += 0.0005 

            const activeAlert = alerts.find(a => a.id === selectedAlertId)
            
            if (activeAlert && activeAlert.coordinates) {
                // Calculate position for the selected threat
                const { lat, lon } = activeAlert.coordinates
                // Match Heatmap Radius (Earth + 0.08)
                const relativePos = latLonToVector3(lat, lon, SCENE_EARTH_RADIUS + 0.08)
                const worldPos = relativePos.clone().applyMatrix4(earthGroup.current.matrixWorld)
                setTargetWorldPos(worldPos)
            } else {
                setTargetWorldPos(null)
            }
        }
    })

    // Get active alert for Heatmap rendering
    const activeAlert = alerts.find(a => a.id === selectedAlertId)

    return (
        <>
            <OrbitsAndSatellites targetWorldPos={targetWorldPos} />
            
            <group ref={earthGroup}>
                <React.Suspense fallback={null}>
                    <TexturedEarth />
                </React.Suspense>
                
                {/* Heatmap overlay - Only show if threat selected */}
                {activeAlert && activeAlert.coordinates && (
                    <HeatmapIndicator position={latLonToVector3(activeAlert.coordinates.lat, activeAlert.coordinates.lon, SCENE_EARTH_RADIUS + 0.08)} />
                )}

                <AtmosphereGlow />
            </group>
        </>
    )
}

export default function EarthScene() {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas camera={{ position: [3, 4, 3], fov: 45 }}>
        <color attach="background" args={[0x000510]} />
        <fog attach="fog" args={[0x000510, 10, 50]} />
        
        <SceneContent />
        
        <ambientLight intensity={0.4} color={0xffffff} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color={0xffffff} />
        
        <StarField />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={20} />
      </Canvas>
    </div>
  )
}
