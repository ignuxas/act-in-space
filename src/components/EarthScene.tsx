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
           <sphereGeometry args={[SCENE_EARTH_RADIUS, 64, 64]} />
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
        const count = 5000;
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

        {/* 2. Target Label (Only when NOT analyzing) */}
        {!isAnalysisOpen && (
             <Html position={[0.2, 0.2, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                <div style={{ color: '#00ccff', fontSize: '8px', fontFamily: 'monospace', opacity: 0.8, letterSpacing: '1px' }}>
                   SIGNAL SOURCE
                </div>
            </Html>
        )}

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
    const satRefs = useRef<THREE.InstancedMesh>(null)
    const glowRefs = useRef<THREE.InstancedMesh>(null)
    const [signals, setSignals] = useState<{satPos: THREE.Vector3, targetPos: THREE.Vector3}[]>([])

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
        }).slice(0, 5) // Keep only a few systems to optimize and then filter for closest
        setSystems(calculatedSystems)
    }, [])

    useFrame(() => {
        if (!satRefs.current || !glowRefs.current || systems.length === 0) return
        
        const now = new Date()
        const tempObj = new THREE.Object3D()
        const activeSats: {satPos: THREE.Vector3, targetPos: THREE.Vector3, dist: number, index: number}[] = []

        // 1. Update all satellite positions
        console.log(glowRefs.current)
        systems.forEach((sys, i) => {
            const pv = satellite.propagate(sys.satrec, now)
            if (pv.position && typeof pv.position !== 'boolean') {
                const pos = eciToThree(pv.position as satellite.EciVec3<number>)
                
                tempObj.position.copy(pos)
                tempObj.scale.set(0, 0, 0) // Hide by default
                tempObj.updateMatrix()
                satRefs.current!.setMatrixAt(i, tempObj.matrix)
                glowRefs.current!.setMatrixAt(i, tempObj.matrix)
                
                // Calculate distance to target if exists
                if (targetWorldPos) {
                    const dist = pos.distanceTo(targetWorldPos)
                    activeSats.push({ satPos: pos.clone(), targetPos: targetWorldPos.clone(), dist, index: i })
                }
            }
        })

        // 2. Filter for the 2 closest satellites
        activeSats.sort((a, b) => a.dist - b.dist);
        const top2 = activeSats.slice(0, 2);

        // 3. Show and connect only the top 2
        const newSignals: {satPos: THREE.Vector3, targetPos: THREE.Vector3}[] = []
        
        // VISUAL CONFIG: We want one satellite to look like a LEO Receiver (Sentinel) and one like a GNSS Transmitter
        // The sorted list 'top2' has the closest satellites. 
        // We'll force the closest one (index 0) to "drop" to LEO altitude visually to act as the Receiver.
        
        top2.forEach((sat, idx) => {
            let visualPos = sat.satPos.clone();

            if (idx === 0) {
                // FORCE LEO ALTITUDE for the "Receiver"
                // Normalize and set scale to slightly above Earth radius (2.0)
                // 2.0 (Earth) + 0.5 (Altitude) = 2.5
                visualPos.normalize().multiplyScalar(SCENE_EARTH_RADIUS * 1.25);
            } else {
                 // Ensure GNSS is high enough (it usually is, but let's clamp it to be safe)
                 const currentDist = visualPos.length();
                 if (currentDist < SCENE_EARTH_RADIUS * 2.5) {
                     visualPos.normalize().multiplyScalar(SCENE_EARTH_RADIUS * 3.5);
                 }
            }

            // Update Mesh Position
            tempObj.position.copy(visualPos)
            tempObj.scale.set(1, 1, 1) // Show
            tempObj.updateMatrix()
            satRefs.current!.setMatrixAt(sat.index, tempObj.matrix)
            
            // Update Glow Position
            tempObj.scale.set(1, 1, 1) // Make glow visible and larger relative to orb (handled by geometry size)
            tempObj.updateMatrix()
            glowRefs.current!.setMatrixAt(sat.index, tempObj.matrix)
            
            // Add connection line
            // IMPORTANT: The line must point exactly to the center of the target ellipsoid.
            newSignals.push({ satPos: visualPos, targetPos: sat.targetPos })
        })

        setSignals(newSignals)
        satRefs.current.instanceMatrix.needsUpdate = true
        glowRefs.current.instanceMatrix.needsUpdate = true
    })

    return (
        <group>
            {/* Draw orbits only for the active satellites? Or all? Let's hide orbits for "stealth" look or show all? 
                User said "only 2 satellites", implying minimal clutter. Let's show only active orbits.
            */}
            {systems.map((sys, i) => {
                 // Check if this system is one of the active ones (we need state for this, but for now let's just show all orbits faintly or hide them)
                 // To strictly follow "only 2 satellites", we should probably hide the orbits of the others too.
                 // But calculating which one is active inside the map is hard without state.
                 // Let's just leaving orbits visible as "potential" coverage but only highlight the 2 sats.
                 return (
                    <Line
                        key={`orbit-${i}`}
                        points={sys.points}
                        color="#004466" // Darker blue for background orbits
                        lineWidth={1}
                        transparent
                        opacity={0.15} // Very faint
                    />
                 )
            })}

            <instancedMesh ref={satRefs} args={[undefined, undefined, systems.length]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </instancedMesh>
            
            <instancedMesh ref={glowRefs} args={[undefined, undefined, systems.length]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial 
                    color="#00ffff" 
                    transparent 
                    opacity={0.4} 
                    blending={THREE.AdditiveBlending} 
                    depthWrite={false}
                />
            </instancedMesh>

            {signals.map((sig, i) => (
                <Line
                    key={`sig-${i}`}
                    points={[sig.satPos, sig.targetPos]}
                    color="#00ff88" // Tech Green for active lock
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
    const { addAlert } = useStore()
    
    useEffect(() => {
        const t1 = setTimeout(() => addAlert("Signal Intercepted: South Pacific (Point Nemo)", "warning"), 2000)
        return () => clearTimeout(t1)
    }, [addAlert])

    useFrame(() => {
        if (earthGroup.current) {
            earthGroup.current.rotation.y += 0.0005 // Earth rotates
            
            // Point Nemo (Oceanic Pole of Inaccessibility): -48.9 S, -123.4 W
            // ADJUSTMENT: Match the HeatmapIndicator Radius exactly (Radius + 0.08)
            const relativePos = latLonToVector3(-48.9, -123.4, SCENE_EARTH_RADIUS + 0.08)
            const worldPos = relativePos.clone().applyMatrix4(earthGroup.current.matrixWorld)
            setTargetWorldPos(worldPos)
        }
    })

    return (
        <>
            <OrbitsAndSatellites targetWorldPos={targetWorldPos} />
            
            <group ref={earthGroup}>
                <React.Suspense fallback={null}>
                    <TexturedEarth />
                </React.Suspense>
                
                {/* Heatmap overlay on surface */}
                <HeatmapIndicator position={latLonToVector3(-48.9, -123.4, SCENE_EARTH_RADIUS + 0.08)} />

                {/* Target Dot - Removed, handled by HeatmapIndicator */}
                
                <AtmosphereGlow />
            </group>
        </>
    )
}

export default function EarthScene() {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas camera={{ position: [3, 4, 3], fov: 45 }}>
        <color attach="background" args={['#000815']} />
        <fog attach="fog" args={['#000815', 5, 50]} />
        
        <SceneContent />
        
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
        
        <StarField />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={20} />
      </Canvas>
    </div>
  )
}
