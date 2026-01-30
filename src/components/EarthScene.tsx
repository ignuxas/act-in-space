'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, extend, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line, Billboard, Text, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import * as satellite from 'satellite.js'
import { gnssTLEs } from '@/lib/tleData'

// --- Constants ---
const EARTH_RADIUS_KM = 6371;
const SCENE_EARTH_RADIUS = 2;
const SCALE = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM;

// --- Shaders ---

const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
  // Softer, larger glow
  float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
  gl_FragColor = vec4(0.0, 0.6, 0.8, 0.4) * intensity;
}
`

// --- Helpers ---

function eciToThree(eci: satellite.EciVec3<number>) {
    return new THREE.Vector3(
        eci.x * SCALE,
        eci.z * SCALE, // North
        -eci.y * SCALE 
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

// --- Components ---

function TexturedEarth() {
   // Use standard textures from a reliable CDN
   // Using React Suspense for loading
   const [colorMap] = useLoader(THREE.TextureLoader, [
       'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'       
   ])
   
   return (
       <mesh>
           <sphereGeometry args={[SCENE_EARTH_RADIUS, 64, 64]} />
           <meshLambertMaterial 
              map={colorMap} 
              color={new THREE.Color(0.6, 0.6, 0.6)} 
           />
       </mesh>
   )
}


function Atmosphere() {
  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[SCENE_EARTH_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function OrbitsAndSatellites({ targetWorldPos }: { targetWorldPos: THREE.Vector3 | null }) {
    const [systems, setSystems] = useState<any[]>([])
    const satRefs = useRef<THREE.InstancedMesh>(null)
    const [signals, setSignals] = useState<{satPos: THREE.Vector3, targetPos: THREE.Vector3}[]>([])

    // Initialize Orbits
    useEffect(() => {
        const now = new Date()
        const calculatedSystems = gnssTLEs.map(tle => {
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
            
            // Calculate Orbit Path
            const periodMins = 720; 
            const points: THREE.Vector3[] = []
            
            for (let i = 0; i <= periodMins; i += 5) { // Higher res
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

    useFrame((state) => {
        if (!satRefs.current || systems.length === 0) return
        
        const now = new Date()
        const tempObj = new THREE.Object3D()
        const newSignals: {satPos: THREE.Vector3, targetPos: THREE.Vector3}[] = []

        systems.forEach((sys, i) => {
            const pv = satellite.propagate(sys.satrec, now)
            if (pv.position && typeof pv.position !== 'boolean') {
                const pos = eciToThree(pv.position as satellite.EciVec3<number>)
                
                tempObj.position.copy(pos)
                tempObj.scale.set(1, 1, 1)
                tempObj.updateMatrix()
                satRefs.current!.setMatrixAt(i, tempObj.matrix)
                
                if (targetWorldPos) {
                    const dist = pos.distanceTo(targetWorldPos)
                     if (dist < 8 && newSignals.length < 4) {
                        newSignals.push({ satPos: pos.clone(), targetPos: targetWorldPos.clone() })
                    }
                }
            }
        })
        setSignals(newSignals)
        satRefs.current.instanceMatrix.needsUpdate = true
    })

    return (
        <group>
            {systems.map((sys, i) => (
                <Line
                    key={`orbit-${i}`}
                    points={sys.points}
                    color="#0088aa"
                    lineWidth={1}
                    transparent
                    opacity={0.4}
                />
            ))}

            <instancedMesh ref={satRefs} args={[undefined, undefined, systems.length]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </instancedMesh>

            {signals.map((sig, i) => (
                <Line
                    key={`sig-${i}`}
                    points={[sig.satPos, sig.targetPos]}
                    color="#00ffff"
                    lineWidth={1}
                    transparent
                    opacity={0.6}
                    dashed
                    dashScale={20}
                    dashSize={0.5}
                    gapSize={0.5}
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
        const t1 = setTimeout(() => addAlert("Signal Intercepted: Baltic Sea", "warning"), 2000)
        return () => clearTimeout(t1)
    }, [addAlert])

    useFrame(() => {
        if (earthGroup.current) {
            earthGroup.current.rotation.y += 0.0005 // Earth rotates
            
            // Adjust Target Position Calculation
            const relativePos = latLonToVector3(54.2, 12.1, SCENE_EARTH_RADIUS + 0.05)
            const worldPos = relativePos.clone().applyMatrix4(earthGroup.current.matrixWorld)
            setTargetWorldPos(worldPos)
        }
    })

    return (
        <>
            <OrbitsAndSatellites targetWorldPos={targetWorldPos} />
            
            <group ref={earthGroup}>
                <React.Suspense fallback={
                    <mesh>
                        <sphereGeometry args={[SCENE_EARTH_RADIUS, 64, 64]} />
                        <meshBasicMaterial color="#001133" wireframe />
                    </mesh>
                }>
                    <TexturedEarth />
                </React.Suspense>
                
                {/* Target Ship */}
                <mesh position={latLonToVector3(54.2, 12.1, SCENE_EARTH_RADIUS + 0.05)}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="#ff0000" toneMapped={false} />
                    <Html position={[0,0.1,0]} center distanceFactor={15}>
                        <div style={{ color: '#ff3333', fontWeight: 'bold', fontSize: '10px', textShadow: '0 0 5px black', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px' }}>TARGET</div>
                    </Html>
                </mesh>
            </group>
            
            <Atmosphere />
        </>
    )
}

export default function EarthScene() {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas camera={{ position: [6, 4, 6], fov: 40 }}>
        <color attach="background" args={['#02040a']} />
        
        <SceneContent />
        
        {/* Lighting Setup for "Tech" Look (No Glare) */}
        <ambientLight intensity={1.5} color="#ccddff" /> 
        {/* Rim Light from back-left */}
        <spotLight position={[-10, 5, -10]} intensity={4} angle={0.5} penumbra={1} color="#2244aa" />
        {/* Soft fill from top-right */}
        <pointLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
        
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={20} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
