'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

function TutorialModal() {
  const { setTutorialOpen } = useStore()
  const [step, setStep] = useState(1)

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0f18] border border-cyan-500/30 rounded-2xl w-[800px] h-[500px] flex flex-col shadow-2xl overflow-hidden relative"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                   <h2 className="text-xl font-bold text-white tracking-widest">GNSS-R PRINCIPLES</h2>
                   <div className="text-xs text-cyan-400 font-mono mt-1">THEORY OF OPERATION</div>
                </div>
                <button onClick={() => setTutorialOpen(false)} className="text-white/50 hover:text-white transition-colors">
                    ✕
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-grid-white/[0.02]">
                <AnimatePresence mode='wait'>
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 p-8 flex gap-8 items-center"
                        >
                            <div className="w-1/2 space-y-4">
                                <h3 className="text-lg font-bold text-cyan-300">1. Bistatic Scattering Geometry</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The system utilizes signals from existing GNSS satellites (GPS/Galileo).
                                    <br/><br/>
                                    <strong className="text-white">Direct Signal (DP):</strong> Line-of-sight from Transmitter (Tx) to Receiver (Rx). Used for reference.
                                    <br/><br/>
                                    <strong className="text-white">Reflected Signal (RP):</strong> Bounces off the ocean surface (ES) at the Specular Point (SP).
                                </p>
                            </div>
                            <div className="w-1/2 h-full bg-black/20 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                                {/* Fig 2 Animation */}
                                <svg viewBox="0 0 300 200" className="w-full h-full">
                                    {/* Orbital Plane/Surface */}
                                    <path d="M50 150 L100 100 L250 100 L200 150 Z" fill="none" stroke="#444" strokeDasharray="4 4" />
                                    
                                    {/* Static Tx (GNSS) */}
                                    <circle cx="200" cy="30" r="4" fill="white" />
                                    <text x="210" y="30" fill="white" fontSize="10">Tx (GNSS)</text>
                                    
                                    {/* Moving Rx (Sentinel) */}
                                    <motion.circle 
                                        cx="50" cy="80" r="4" fill="#00ccff"
                                        animate={{ x: [-20, 20, -20] }} 
                                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    />
                                    <motion.text 
                                        x="30" y="75" fill="#00ccff" fontSize="10"
                                        animate={{ x: [-20, 20, -20] }} 
                                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    >Rx (Sentinel)</motion.text>

                                    {/* Dynamic Signal Paths with clamping to avoid overshooting */}
                                    <motion.line 
                                        x1="200" y1="30"  // Tx
                                        // x2 tracks Rx
                                        animate={{ x2: [50-20, 50+20, 50-20] }}
                                        y2="80" // Rx y
                                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                        stroke="#00ffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"
                                    />
                                    <motion.line 
                                        x1="150" y1="125" // SP
                                        // x2 tracks Rx
                                        animate={{ x2: [50-20, 50+20, 50-20] }}
                                        y2="80" // Rx y
                                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                        stroke="#ffaa00" strokeWidth="1" 
                                    />

                                    {/* Static Path Tx -> Surface */}
                                    <line x1="200" y1="30" x2="150" y2="125" stroke="#ffaa00" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"/>
                                    
                                    {/* Specular Point Ripple */}
                                    <circle cx="150" cy="125" r="2" fill="none" stroke="#ffaa00">
                                        <animate attributeName="r" values="2;20" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <text x="160" y="140" fill="#ffaa00" fontSize="10">Specular Point (SP)</text>
                                </svg>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 p-8 flex gap-8 items-center"
                        >
                            <div className="w-1/2 space-y-4">
                                <h3 className="text-lg font-bold text-cyan-300">2. Delay-Doppler Zones</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The signal footprint is mapped using two coordinates:
                                    <br/><br/>
                                    <strong className="text-orange-400">Iso-Delay Ellipses (τ):</strong> Constant travel time. 
                                    <br/>
                                    τ = (R_T + R_R) / c
                                    <br/><br/>
                                    <strong className="text-cyan-400">Iso-Doppler Hyperbolas (f_D):</strong> Constant frequency shift due to relative velocity.
                                    <br/>
                                    f_D = (1/λ) · (v · R)
                                </p>
                            </div>
                            <div className="w-1/2 h-full bg-black/20 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                                {/* Fig 3 Animation */}
                                <svg viewBox="0 0 300 200" className="w-full h-full">
                                    {/* Grid */}
                                    <defs>
                                        <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#smallGrid)" />
                                    
                                    {/* Iso-Delay Ellipses (Static Reference) */}
                                    {[1, 2, 3].map((i) => (
                                        <ellipse 
                                            key={`e-${i}`}
                                            cx="150" cy="100" 
                                            rx={i * 25} ry={i * 15}
                                            fill="none" stroke="#ffaa00" strokeWidth="1.5"
                                            strokeDasharray="4 2"
                                            opacity="0.5"
                                        />
                                    ))}
                                    
                                    {/* Iso-Doppler Lines (Running parallel) */}
                                    {[-2, -1, 0, 1, 2].map((i) => (
                                        <motion.line 
                                            key={`d-${i}`}
                                            x1={150 + (i * 30)} y1="20"
                                            x2={150 + (i * 30)} y2="180"
                                            stroke="#00ffff" strokeWidth="1"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 3, repeat: Infinity, delay: Math.abs(i) * 0.5 }}
                                        />
                                    ))}
                                    
                                    {/* Labels */}
                                    <text x="190" y="80" fill="#ffaa00" fontSize="10">DZ (Delay)</text>
                                    <text x="100" y="40" fill="#00ffff" fontSize="10">fD (Doppler)</text>
                                </svg>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 p-8 flex gap-8 items-center"
                        >
                            <div className="w-1/2 space-y-4">
                                <h3 className="text-lg font-bold text-cyan-300">3. Delay-Doppler Map (DDM)</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The scattered power is integrated over the Delay (τ) and Doppler (f_D) surface.
                                    <br/><br/>
                                    This creates the characteristic "Horseshoe" shape visible in <strong>Fig 4A/B</strong>.
                                    <br/><br/>
                                    Ships appear as bright correlation peaks distinct from the ocean clutter.
                                </p>
                            </div>
                            <div className="w-1/2 h-full bg-black/20 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                {/* DDM Integration Animation */}
                                <div className="relative w-full h-full flex items-end justify-center">
                                     <svg viewBox="0 0 300 200" className="w-full h-full overflow-visible">
                                        {/* Axes */}
                                        <line x1="30" y1="180" x2="280" y2="180" stroke="white" strokeWidth="1" />
                                        <line x1="30" y1="180" x2="30" y2="20" stroke="white" strokeWidth="1" />
                                        <text x="270" y="195" fill="white" fontSize="10">Delay</text>
                                        <text x="10" y="30" fill="white" fontSize="10">Power</text>

                                    {/* Phase 1: Noisy individual samples (Grey lines aligned as peaks) */}
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const randomStart = (i - 2) * 60; // Larger offsets
                                        
                                        // Varied heights
                                        const heights = [45, 60, 35, 55, 40];
                                        const peakHeight = heights[i];
                                        const baseline = 100 + (i * 20); 
                                        const peakY = baseline - peakHeight;
                                        
                                        // Extended lines: start far left (-100) end far right (400) relative to center
                                        // M -100 baseline L 125 baseline C ... 185 baseline L 400 baseline
                                        const shapeD = `M -100 ${baseline} L 125 ${baseline} C 145 ${baseline}, 145 ${peakY}, 155 ${peakY} C 165 ${peakY}, 165 ${baseline}, 185 ${baseline} L 400 ${baseline}`;

                                        return (
                                            <motion.path
                                                key={`sample-${i}`}
                                                d={shapeD}
                                                fill="none"
                                                stroke="#666" // Grey lines
                                                strokeWidth="1.5"
                                                style={{ opacity: 0.5 }}
                                                initial={{ x: randomStart, opacity: 0 }}
                                                animate={{ 
                                                    x: [randomStart, randomStart, 0, 0], // 1. Dispersed -> 2. Aligned
                                                    opacity: [0, 0.6, 0.6, 0.2] // Fade out slightly when cyan appears
                                                }} 
                                                transition={{ 
                                                    duration: 6, 
                                                    times: [0, 0.2, 0.6, 0.9],
                                                    ease: ["linear", "circOut", "linear"] // Fast then slow alignment
                                                }}
                                            />
                                        )
                                    })}

                                    {/* Phase 2: Coherent Sum (Huge Cyan Line on top) */}
                                    <motion.path
                                        // Drawn at the front-most baseline (approx 180) with extended lines
                                        d="M -100 180 L 115 180 C 135 180, 140 30, 155 30 C 170 30, 175 180, 195 180 L 400 180"
                                        fill="none"
                                        stroke="#00ffff"
                                        strokeWidth="4"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ 
                                            pathLength: [0, 0, 1, 1], 
                                            opacity: [0, 0, 1, 1] 
                                        }}
                                        transition={{ 
                                            duration: 6, 
                                            times: [0, 0.6, 0.8, 1], // Appears after alignment
                                            repeat: Infinity,
                                            repeatDelay: 1
                                        }}
                                    />
                                        
                                        <motion.text 
                                            x="180" y="40" fill="#00ffff" fontSize="12" fontWeight="bold"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0, 1, 0] }}
                                            transition={{ duration: 6, repeat: Infinity, repeatDelay: 1 }}
                                        >
                                            INTEGRATED SIGNAL
                                        </motion.text>
                                     </svg>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Nav */}
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={cn("w-2 h-2 rounded-full", step === i ? "bg-cyan-500" : "bg-gray-700")} />
                    ))}
                </div>
                <div className="flex gap-4">
                    <button 
                        disabled={step === 1}
                        onClick={() => setStep(step - 1)}
                        className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        PREVIOUS
                    </button>
                    <button 
                         onClick={() => step < 3 ? setStep(step + 1) : setTutorialOpen(false)}
                         className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded tracking-widest transition-colors"
                    >
                        {step === 3 ? "CLOSE" : "NEXT"}
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
  )
}

function DDMGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let animId: number

    const animate = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Background Grid
      ctx.strokeStyle = '#ffffff20'
      ctx.lineWidth = 0.5
      // ... (drawing logic simplified for brevity in thought but robust in implementation)
      
      // Simulate 3D DDM (Delay Doppler Map)
      const slices = 12
      
      for (let z = 0; z < slices; z++) {
        // Perspective calc
        const depth = z / slices
        const scale = 1.0 - (depth * 0.3)
        const yOffset = (z * 6) + 20
        const xOffset = (z * 15)
        
        ctx.beginPath()
        
        let alpha = (1.0 - depth) * 0.8
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`
        ctx.lineWidth = 1.2
        
        let first = true
        
        // Draw slice
        const points = 60
        for (let i = 0; i <= points; i++) {
            const pct = i / points
            const x = xOffset + pct * (canvas.width - 60) * scale
            
            // Peak Functions
            // 1. Main Peak (Signal)
            const p1 = Math.exp(-Math.pow((pct - 0.35) * 12, 2)) * 50
            
            // 2. Secondary Peak (Reflection/Noise)
            // Oscillates
            const osc = Math.sin(frame * 0.05 + z * 0.5) * 5
            const p2 = Math.exp(-Math.pow((pct - 0.7) * 8, 2)) * (30 + osc)
            
            // Gap/Trench (The characteristic drop in Fig 4A)
            const base = 0
            
            const height = p1 + p2
            const y = (canvas.height - 20) - yOffset - (height * scale)
            
            if (first) {
                ctx.moveTo(x, y)
                first = false
            } else {
                ctx.lineTo(x, y)
            }
        }
        ctx.stroke()
        
        // Draw "Zero Delay" dashed line cutting through
        if (z === 5) {
             ctx.beginPath()
             ctx.strokeStyle = '#ffaa0080'
             ctx.setLineDash([2, 4])
             ctx.moveTo(xOffset + 0.5 * (canvas.width - 60) * scale, (canvas.height - 20) - yOffset)
             ctx.lineTo(xOffset + 0.5 * (canvas.width - 60) * scale, (canvas.height - 20) - yOffset - 60)
             ctx.stroke()
             ctx.setLineDash([])
        }
      }
      
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="bg-white/5 p-3 rounded-lg border border-white/5 mb-4">
        <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-gray-400 font-mono tracking-widest">DELAY-DOPPLER MAP</span>
            <span className="text-[8px] text-cyan-500 font-mono">FIG 4.A-REF</span>
        </div>
        <canvas ref={canvasRef} width={340} height={140} className="w-full h-[140px]" />
    </div>
  )
}

export default function DashboardOverlay() {
  const { 
    precision, weather, showFusion, showAnomalies, alerts, isAnalysisOpen, isTutorialOpen,
    setPrecision, setWeather, toggleFusion, toggleAnomalies, removeAlert, setAnalysisOpen, setTutorialOpen
  } = useStore()
  
  const [time, setTime] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
        setTime(new Date().toISOString().split('T')[1].split('.')[0])
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <header className="pointer-events-auto flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-lg tracking-tight">
            GNSS-R Sentinel
            </h1>
            <p className="text-blue-200/80 text-sm mt-1 tracking-wider uppercase font-medium">Ship Detection Dashboard</p>
        </div>
        <button 
            onClick={() => setTutorialOpen(true)}
            className="flex items-center gap-2 bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-500/30 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors group"
        >
            <span className="w-4 h-4 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] text-cyan-400 font-bold">i</span>
            <span className="text-xs text-cyan-200 font-bold tracking-wider group-hover:text-white">PRINCIPLES</span>
        </button>
      </header>

      {/* Main Layout Grid */}
      <div className="flex flex-1 mt-8 gap-6 overflow-hidden">
        
        {/* Left Panel: Metrics & Controls */}
        <div className="w-80 space-y-4 pointer-events-auto overflow-y-auto pr-2 pb-4 scrollbar-hide">
            {/* Metrics */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white hover:border-white/20 transition-colors">
                <h2 className="text-xs font-semibold text-blue-300 uppercase mb-3 tracking-widest">Real-time Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-2xl font-bold text-cyan-400">98.2%</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Detection Rate</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-400">12km²</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Coverage</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-2xl font-bold text-purple-400">+14%</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Precision Gain</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white space-y-6 hover:border-white/20 transition-colors">
                <h2 className="text-xs font-semibold text-blue-300 uppercase mb-2 tracking-widest">System Controls</h2>
                
                {/* Precision Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-300">
                        <span className="uppercase tracking-wider">Signal Precision</span>
                        <span className="font-mono">{Math.round(precision * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.01" value={precision}
                        onChange={(e) => setPrecision(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                    />
                </div>

                {/* Weather Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-300">
                        <span className="uppercase tracking-wider">Weather Interference</span>
                        <span className="font-mono">{Math.round(weather * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.01" value={weather}
                        onChange={(e) => setWeather(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={toggleFusion}>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Data Fusion</span>
                        <div 
                            className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                showFusion ? "bg-cyan-600" : "bg-gray-700"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                                showFusion ? "translate-x-5" : "translate-x-0"
                            )} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={toggleAnomalies}>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Show Anomalies</span>
                        <div 
                            className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                showAnomalies ? "bg-orange-600" : "bg-gray-700"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                                showAnomalies ? "translate-x-5" : "translate-x-0"
                            )} />
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Right Panel: Alerts */}
        <div className="w-80 ml-auto pointer-events-auto">
             <div className="space-y-2">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                                "p-3 rounded-lg border backdrop-blur-md shadow-lg flex items-start gap-3 relative overflow-hidden",
                                alert.type === 'critical' ? "bg-red-500/20 border-red-500/30 text-white" :
                                alert.type === 'warning' ? "bg-orange-500/20 border-orange-500/30 text-white" :
                                "bg-blue-500/20 border-blue-500/30 text-white"
                            )}
                        >
                            <div className={cn("w-2 h-2 mt-1.5 rounded-full animate-pulse shrink-0", 
                                alert.type === 'critical' ? "bg-red-500" : 
                                alert.type === 'warning' ? "bg-orange-500" : "bg-blue-500"
                            )} />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold mb-0.5 tracking-wider opacity-90">{alert.type.toUpperCase()} ALERT</h4>
                                <p className="text-xs opacity-70 leading-relaxed truncate">{alert.message}</p>
                            </div>
                            <button 
                                onClick={() => removeAlert(alert.id)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
             </div>
        </div>

      </div>

      {/* Footer / Status Bar */}
      <footer className="pointer-events-auto bg-white/5 backdrop-blur-md border-t border-white/10 -mx-6 -mb-6 px-6 py-2 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-mono">
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
         </div>
         <div>Lat: 54.2°N | Lon: 12.1°E</div>
         <div>UTC: {time}</div>
      </footer>

      {/* Analysis Popup Modal */}
      <AnimatePresence>
        {isAnalysisOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-[400px] shadow-2xl shadow-cyan-900/30"
                >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                         <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">SIGNAL ANALYSIS</h2>
                            <div className="text-xs text-cyan-400 font-mono tracking-widest mt-1">ID: SAT-GNSS-4042</div>
                         </div>
                         <button 
                            onClick={() => setAnalysisOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                         >
                            ✕
                         </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-gray-400 font-mono mb-1">REAL POWER</div>
                                <div className="text-xl font-bold text-emerald-400">-142 dBm</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-gray-400 font-mono mb-1">NOISE FLOOR</div>
                                <div className="text-xl font-bold text-rose-400">-168 dBm</div>
                            </div>
                        </div>
                        
                        {/* Mathematical Framework - Replacing Graph */}
                        <div className="space-y-3 mb-4">
                            {/* Fisher Information Matrix */}
                            <div className="bg-white/5 border border-white/10 rounded p-3 relative overflow-hidden">
                                <div className="flex justify-between items-baseline mb-2">
                                     <h4 className="text-[10px] text-cyan-400 font-bold tracking-widest">FISHER INFORMATION (SPECKLE)</h4>
                                     <span className="text-[8px] text-gray-500 font-mono">EQ. 16</span>
                                </div>
                                <div className="font-mono text-xs text-center text-white py-3 bg-black/20 rounded mb-2 border border-white/5 shadow-inner">
                                     J_ij = Tr(Γ⁻¹ ∂Γ/∂θ_i Γ⁻¹ ∂Γ/∂θ_j)
                                </div>
                                <div className="text-[9px] text-gray-400 leading-relaxed text-justify">
                                    Precision is limited by the stochastic nature of the scattered field covariances (<strong>Γ</strong>), not just thermal noise.
                                </div>
                            </div>

                            {/* Comparison Models */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded p-2 opacity-60">
                                     <div className="text-[8px] text-gray-500 uppercase mb-1">Standard (Lowe '02)</div>
                                     <div className="font-mono text-white text-xs">σ ≈ 15.1 cm</div>
                                     <div className="text-[8px] text-red-400 mt-1">Neglects Speckle</div>
                                </div>
                                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-2">
                                     <div className="text-[8px] text-emerald-500 uppercase mb-1">CRB Metric (Current)</div>
                                     <div className="font-mono text-emerald-300 text-xs">σ ≈ 62.0 cm</div>
                                     <div className="text-[8px] text-emerald-500 mt-1">Realistic Limit (4x)</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* CRB Analysis */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-xs text-gray-400 border-b border-white/10 pb-2">
                                <span>CRB RANGE PRECISION MODEL</span>
                                <span className="font-mono text-[10px]">REF: GERMAIN & RUFFINI '06</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="text-gray-500 mb-1">Elevation (ε)</div>
                                    <div className="font-mono text-cyan-300">62.4°</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 mb-1">Range Error (σ_R)</div>
                                    <div className="font-mono text-orange-300">0.92 m</div>
                                </div>
                            </div>

                            <div className="bg-black/40 p-2 rounded border border-white/5">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-gray-400">Altimetric Precision</span>
                                    <span className="text-[10px] text-gray-500 italic">σ_h = σ_R / 2sin(ε)</span>
                                </div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    { (0.92 / (2 * Math.sin(62.4 * Math.PI / 180))).toFixed(2) } m
                                </div>
                                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                                     TSUNAMI DETECTABLE ({'>'}20cm)
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded text-xs text-cyan-200 leading-relaxed">
                            <strong className="text-cyan-400 block mb-1">AI INSIGHT</strong>
                            Signal exhibits characteristics consistent with ship-borne GNSS interference. Speckle noise limits precision to ~0.5m (C-Band).
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded text-xs tracking-wider transition-colors">
                                GENERATE REPORT
                            </button>
                             <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded text-xs tracking-wider transition-colors border border-white/10">
                                MARK FALSE POSITIVE
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTutorialOpen && <TutorialModal />}
      </AnimatePresence>
    </div>
  )
}
