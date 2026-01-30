'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

// --- Shaders ---

const earthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vObjPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vObjPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const earthFragmentShader = `
uniform float uTime;
uniform float uPrecision;
uniform bool uShowAnomalies;
uniform vec3 uOceanColor;
uniform vec3 uAnomalyColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vObjPosition;

// Simple pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  // Base
  vec3 color = uOceanColor;
  
  // Create a grid/wave pattern
  float grid = sin(vObjPosition.x * 20.0 + uTime) * sin(vObjPosition.y * 20.0 + uTime);
  
  // Anomaly detection scanning line effect
  float scan = sin(vObjPosition.y * 10.0 - uTime * 2.0);
  
  if (uShowAnomalies) {
    // Generate some "noise" spots based on precision
    float noise = random(floor(vUv * 50.0) + floor(uTime * 0.5));
    
    // Higher precision = clearer signal (less noise or more distinct markers)
    // For visualization: Precision controls the mix of the anomaly color
    
    float anomalyIntensity = 0.0;
    if (grid > 0.95 - (uPrecision * 0.1)) {
        anomalyIntensity = 1.0;
    }
    
    // Mix with anomaly color
    color = mix(color, uAnomalyColor, anomalyIntensity * step(0.5, scan));
  }

  // Basic lighting
  float intensity = 1.05 - dot(vNormal, vec3(0.0, 0.0, 1.0));
  vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 3.0);

  gl_FragColor = vec4(color + atmosphere * 0.4, 1.0);
}
`

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
  float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
  gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}
`

// --- Components ---

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  // const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const { precision, showAnomalies } = useStore()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPrecision: { value: precision },
      uShowAnomalies: { value: showAnomalies },
      uOceanColor: { value: new THREE.Color(0.1, 0.3, 0.6) },
      uAnomalyColor: { value: new THREE.Color(1.0, 0.3, 0.1) },
    }),
    []
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
      
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.getElapsedTime()
      material.uniforms.uPrecision.value = precision
      material.uniforms.uShowAnomalies.value = showAnomalies
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function Atmosphere() {
  return (
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  )
}

function Markers() {
  const { addAlert } = useStore()
  // 54.2 N, 12.1 E (Baltic Sea)
  // Lat: 54.2 -> Phi: 90 - 54.2 = 35.8
  // Lon: 12.1 -> Theta: 12.1
  const lat = 54.2
  const lon = 12.1
  
  // Convert to Cartesian
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180) // Adjust +180 to align with typical texture maps or just use lon
  // Actually THREE.SphereGeometry(radius, widthSegments, heightSegments)
  // UVs map such that (0,0.5) is usually -Z? It varies.
  // Standard conversion:
  const r = 2.05 // Slightly above surface
  const x = -r * Math.sin(phi) * Math.cos(lon * Math.PI / 180) // Adjust signs by trial if needed
  const z = r * Math.sin(phi) * Math.sin(lon * Math.PI / 180)
  const y = r * Math.cos(phi)
  
  // Let's create a pulsing marker
  const markerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (markerRef.current) {
       const scale = 1 + Math.sin(state.clock.getElapsedTime() * 5) * 0.2
       markerRef.current.scale.set(scale, scale, scale)
    }
  })

  // Detect logic (mock)
  useEffect(() => {
    const timer = setTimeout(() => {
        addAlert("Dark Ship detected in Baltic Sector", "warning")
    }, 3000)
    return () => clearTimeout(timer)
  }, [addAlert])

  return (
    <mesh ref={markerRef} position={[x, y, z]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="#ff3300" transparent opacity={0.8} />
      <Html distanceFactor={10}>
        <div className="bg-black/50 text-white text-xs p-1 rounded backdrop-blur-sm pointer-events-none">
          Target
        </div>
      </Html>
    </mesh>
  )
}

function Satellites() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2
            groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.2
        }
    })

    return (
        <group ref={groupRef}>
             {/* Orbiting Satellite 1 */}
            <mesh position={[3, 0, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.2]} />
                <meshStandardMaterial color="white" />
            </mesh>
             {/* Orbiting Satellite 2 */}
            <mesh position={[-2.5, 1.5, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.2]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    )
}

export default function EarthScene() {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Earth />
        <Atmosphere />
        <Markers />
        <Satellites />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={true} enablePan={false} minDistance={3} maxDistance={10} />
      </Canvas>
    </div>
  )
}
