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
                            <div className="w-1/3 space-y-4">
                                <h3 className="text-lg font-bold text-cyan-300">3. Delay-Doppler Map (DDM)</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The scattered power is mapped against Delay (τ) and Doppler (f_D).
                                    <br/><br/>
                                    <strong>Correlation Peaks:</strong> Ships reflect signals coherently, creating sharp "mountain" peaks (Fig 4A) that stand out against the ocean noise floor.
                                    <br/><br/>
                                    <strong>Visual:</strong> See how the chaotic noise floor resolves into a clear signal spike as integration time increases.
                                </p>
                            </div>
                            <div className="w-2/3 h-full bg-black/20 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center p-4">
                                <div className="relative w-full h-full">
                                     <svg viewBox="-50 -50 400 350" className="w-full h-full overflow-visible" style={{transform: 'rotateX(10deg)'}}>
                                        {/* 3D Waterfall Plot: Slices from Back to Front */}
                                        {Array.from({ length: 8 }).map((_, i) => {
                                            // 3D Projection Math
                                            const depth = 7 - i; // 0 is front
                                            const offsetX = depth * 35; // Shift Right for depth
                                            const offsetY = depth * -25; // Shift Up for depth
                                            const baseY = 250 + offsetY;
                                            const startX = -300 + offsetX; // Extend WAY out (infinite feel)
                                            const endX = 600 + offsetX;
                                            
                                            // Peak Logic
                                            const peakX = 150 + offsetX;
                                            const peakHeight = 60;

                                            // Shift Logic: Alternate left/right shifts for the "Misaligned" state
                                            // Fixed pseudo-random based on index to avoid hydration mismatch
                                            const shiftAmount = ((i * 37) % 100) - 50 + (i % 2 === 0 ? 60 : -60);
                                            const shiftedPeakX = peakX + shiftAmount;

                                            // PATH GENERATION
                                            // 1. Aligned Path (The Target)
                                            const alignedD = `M ${startX} ${baseY} 
                                                L ${peakX - 40} ${baseY} 
                                                C ${peakX - 20} ${baseY}, ${peakX - 20} ${baseY - peakHeight * 1.5}, ${peakX} ${baseY - peakHeight} 
                                                C ${peakX + 20} ${baseY - peakHeight * 1.5}, ${peakX + 20} ${baseY}, ${peakX + 40} ${baseY} 
                                                L ${endX} ${baseY}`;
                                            
                                            // 2. Shifted Path (The Start)
                                            // Note: Control points move with the peak
                                            const shiftedD = `M ${startX} ${baseY} 
                                                L ${shiftedPeakX - 40} ${baseY} 
                                                C ${shiftedPeakX - 20} ${baseY}, ${shiftedPeakX - 20} ${baseY - peakHeight * 1.5}, ${shiftedPeakX} ${baseY - peakHeight} 
                                                C ${shiftedPeakX + 20} ${baseY - peakHeight * 1.5}, ${shiftedPeakX + 20} ${baseY}, ${shiftedPeakX + 40} ${baseY} 
                                                L ${endX} ${baseY}`;

                                            const isCenterSlice = i === 4;

                                            return (
                                                <g key={i}>
                                                    {/* Floor Line (Static) */}
                                                    <path 
                                                        d={`M ${startX} ${baseY} L ${endX} ${baseY}`} 
                                                        stroke="rgba(255,255,255,0.05)" 
                                                        strokeWidth="1" 
                                                        strokeDasharray="4 4" 
                                                        fill="none"
                                                    />
                                                    
                                                    {/* The Wobbly Signal Line */}
                                                    <motion.path
                                                        fill="rgba(0,0,0,0.5)" // Semi-transparent black fill
                                                        stroke={isCenterSlice ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}
                                                        strokeWidth={1.5}
                                                        
                                                        initial={{ d: shiftedD }}
                                                        animate={{ d: [shiftedD, shiftedD, alignedD, alignedD] }}
                                                        transition={{
                                                            duration: 6,
                                                            times: [0, 0.2, 0.5, 1], // Wait, then Align, the Hold
                                                            repeat: Infinity,
                                                            repeatDelay: 2
                                                        }}
                                                    />
                                                </g>
                                            )
                                        })}

                                        {/* THE HUGE LINE: Integrated Coherent Sum */}
                                        {/* Drawn on top (overlay), matching the geometry of the center slice (i=4) */}
                                        <motion.path
                                            d={`M ${-300 + (3 * 35)} ${250 + (3 * -25) - 5} 
                                                L ${150 + (3 * 35) - 40} ${250 + (3 * -25) - 5}
                                                C ${150 + (3 * 35) - 20} ${250 + (3 * -25) - 5}, 
                                                  ${150 + (3 * 35) - 20} ${250 + (3 * -25) - 120}, 
                                                  ${150 + (3 * 35)} ${250 + (3 * -25) - 90} 
                                                C ${150 + (3 * 35) + 20} ${250 + (3 * -25) - 120}, 
                                                  ${150 + (3 * 35) + 20} ${250 + (3 * -25) - 5}, 
                                                  ${150 + (3 * 35) + 40} ${250 + (3 * -25) - 5}
                                                L ${600 + (3 * 35)} ${250 + (3 * -25) - 5}`}
                                                
                                            fill="none"
                                            stroke="#00ffff"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            filter="drop-shadow(0 0 8px #00ffff)"
                                            
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{
                                                duration: 1.5,
                                                delay: 3, // Wait for alignment (which happens at t=0.5 of 6s -> 3s)
                                                repeat: Infinity,
                                                repeatDelay: 6.5 // 6s duration + 2s delay - 1.5s active? 
                                                // Loop cycle: 6s + 2s = 8s total cycle for lines.
                                                // We want this to trigger every 8s.
                                            }}
                                        />
                                        <motion.text 
                                            x="300" y="50" fill="#00ffff" fontSize="14" fontWeight="bold" fontFamily="monospace"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ delay: 3, duration: 3, repeat: Infinity, repeatDelay: 5 }}
                                        >
                                            COHERENT GAIN +12dB
                                        </motion.text>

                                        {/* Axis Labels floated in 3D space */}
                                        <text x="350" y="280" fill="gray" fontSize="10" transform="rotate(-15)">Delay (τ)</text>
                                        <text x="-20" y="100" fill="gray" fontSize="10" transform="rotate(-15)">Doppler (fD)</text>
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

export default function DashboardOverlay() {
  const { 
    precision, weather, showFusion, showAnomalies, alerts, isAnalysisOpen, isTutorialOpen,
    setPrecision, setWeather, toggleFusion, toggleAnomalies, removeAlert, setAnalysisOpen, setTutorialOpen,
    selectedAlertId, setSelectedAlert
  } = useStore()
  
  const [time, setTime] = useState('')
  const [activeTab, setActiveTab] = useState('SYSTEMS')
  const [logs, setLogs] = useState<string[]>([
    "12:00:01 SYS_BOOT_SEQ_INIT",
    "12:00:02 LNA_GAIN_SET: 24dB",
    "12:00:02 LOCK_ACQ: PRN 12, 14, 22",
    "12:00:03 TRACKING_LOOP_ENGAGED",
    "12:00:04 ANOMALY_SCAN_ACTIVE",
  ])
  const [satellites, setSatellites] = useState([
    { id: 'GPS-12', el: 62, az: 110, snr: 45 },
    { id: 'GAL-04', el: 45, az: 230, snr: 42 },
    { id: 'GPS-24', el: 81, az: 15, snr: 48 },
    { id: 'GLO-18', el: 22, az: 310, snr: 38 },
  ])
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date()
        setTime(now.toISOString().split('T')[1].split('.')[0] + 'Z')
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const addLog = (msg: string) => {
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev.slice(-19), `${timeStr} ${msg}`])
  }

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Simulate Satellite Live Data (Affected by System Controls)
  useEffect(() => {
    const interval = setInterval(() => {
        setSatellites(prev => prev.map(sat => {
            // Weather reduces overall signal strength (max 15dBm penalty)
            const weatherPenalty = weather * 15
            // Precision reduces the noise/jitter (higher precision = lower noise)
            const noiseFloor = (1 - precision) * 4 
            
            const jitter = (Math.random() - 0.5) * noiseFloor
            
            return {
                ...sat,
                snr: Math.max(10, Math.min(55, sat.snr + jitter - (weatherPenalty * 0.05))), // Slow drift towards penalty
                el: sat.el + (Math.random() * 0.02), 
                az: sat.az + (Math.random() * 0.02)
            }
        }))
    }, 500)
    return () => clearInterval(interval)
  }, [precision, weather]) // Re-run when controls change

  // System Event Logging
  useEffect(() => {
      // Periodic "Heartbeat" logs
      const interval = setInterval(() => {
          if (Math.random() > 0.7) {
              const msgs = ["BUFFER_FLUSH_OK", "TEMP_bg: 24.2C", "SYNC_CHECK", "MEM_ALLOC_OK", "UPLINK_STABLE"]
              addLog(msgs[Math.floor(Math.random() * msgs.length)])
          }
      }, 4000)
      return () => clearInterval(interval)
  }, [])

  // Log User Interactions
  useEffect(() => { addLog(`PRECISION_ADJ: ${(precision*100).toFixed(0)}%`) }, [precision])
  useEffect(() => { addLog(`WX_INTERFERENCE_ADJ: ${(weather*100).toFixed(0)}%`) }, [weather])
  useEffect(() => { addLog(`FUSION_LAYER: ${showFusion ? 'ENABLED' : 'DISABLED'}`) }, [showFusion])
  useEffect(() => { addLog(`ANOMALY_OVERLAY: ${showAnomalies ? 'ENABLED' : 'DISABLED'}`) }, [showAnomalies])
  useEffect(() => { if(isAnalysisOpen) addLog("ANALYSIS_MODAL_OPEN: SAT-GNSS-4042") }, [isAnalysisOpen])

  useEffect(() => {
    const timer = setInterval(() => {
        setTime(new Date().toISOString().split('T')[1].split('.')[0])
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pointer-events-auto flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pb-4"
      >
        <div>
            <h1 className="text-3xl font-black text-white tracking-widest leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            GNSS-R <span className="text-cyan-400">SENTINEL</span>
            </h1>
            <div className="flex items-center gap-3 mt-1 opacity-70">
                <span className="text-[10px] font-mono text-cyan-200 border border-cyan-500/30 px-1 rounded bg-cyan-900/20">V.2.4.0-RC</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Maritime Surveillance Array</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
             {/* Clock */}
             <div className="text-right hidden md:block">
                <div className="text-2xl font-mono text-white font-bold tracking-widest leading-none">{time}</div>
                <div className="text-[10px] text-gray-400 font-mono text-right">UTC ZULU</div>
             </div>
             
             <div className="h-8 w-[1px] bg-white/20 mx-2"></div>

             <button 
                onClick={() => setTutorialOpen(true)}
                className="flex items-center gap-2 bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-500/30 px-4 py-2 rounded-sm backdrop-blur-md transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] group"
            >
                <span className="w-4 h-4 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] text-cyan-400 font-bold">?</span>
                <span className="text-xs text-cyan-200 font-bold tracking-wider group-hover:text-white">THEORY</span>
            </button>
        </div>
      </motion.header>

      {/* Main Layout Grid */}
      <div className="flex flex-1 mt-4 gap-6 overflow-hidden">
        
        {/* Left Panel: Metrics & Controls */}
        <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-80 flex flex-col gap-4 pointer-events-auto"
        >
            {/* Tab Navigation */}
            <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-sm p-1 gap-1">
                {['SYSTEMS', 'CONSTELLATION', 'DATA LOGS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold tracking-wider rounded transition-all",
                            activeTab === tab 
                                ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30" 
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="overflow-y-auto pr-2 pb-4 scrollbar-hide space-y-4 max-h-[calc(100vh-250px)]">
                {activeTab === 'SYSTEMS' && (
                    <>
                        {/* Metrics */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white hover:border-white/20 transition-colors">
                            <h2 className="text-xs font-semibold text-blue-300 uppercase mb-3 tracking-widest">Real-time Metrics</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    {/* Detection Rate: High Precision increases it, Weather decreases it */}
                                    <div className="text-2xl font-bold text-cyan-400">
                                        {(85 + (precision * 15) - (weather * 10)).toFixed(1)}%
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Detection Rate</div>
                                </div>
                                <div>
                                    {/* Coverage: Weather heavily impacts effective coverage area */}
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {(12 * (1 - weather * 0.4)).toFixed(1)}km²
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Coverage</div>
                                </div>
                                <div className="col-span-2">
                                    {/* Precision Gain: Direct correlation to precision slider */}
                                    <div className="text-2xl font-bold text-purple-400">
                                        {((precision - 0.5) * 40).toFixed(1)} dB
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Processing Gain</div>
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
                    </>
                )}

                {activeTab === 'CONSTELLATION' && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                             <div className="text-xs text-gray-400">GDOP</div>
                             <div className="text-lg font-mono font-bold text-emerald-400">1.2</div>
                        </div>

                        <h2 className="text-xs font-semibold text-blue-300 uppercase mb-3 tracking-widest mt-4">Visible Satellites</h2>
                        {satellites.map((sat) => (
                            <div key={sat.id} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-300 font-mono">
                                    <span>{sat.id}</span>
                                    <span className="text-[10px] text-gray-500">Az:{sat.az.toFixed(1)}° El:{sat.el.toFixed(1)}°</span>
                                </div>
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out" 
                                        style={{ width: `${(sat.snr/55)*100}%` }}
                                    />
                                </div>
                                <div className="text-[8px] text-right text-gray-500 font-mono leading-none">{sat.snr.toFixed(1)} dBHz</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'DATA LOGS' && (
                     <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-[10px] text-gray-400 h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <div className="text-emerald-500 mb-2 border-b border-emerald-500/20 pb-1 flex justify-between">
                            <span>[SYSTEM DIAGNOSTICS]</span>
                            <span className="animate-pulse">●</span>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end min-h-[300px]">
                            {logs.map((log, i) => (
                                <div key={i} className={cn(
                                    "break-words",
                                    log.includes('WARN') ? "text-orange-400" :
                                    log.includes('ALERT') ? "text-red-400" :
                                    log.includes('DETECTED') ? "text-cyan-300" :
                                    "text-gray-400"
                                )}>
                                    <span className="opacity-50 mr-2">{log.split(' ')[0]}</span>
                                    <span className="opacity-90">{log.substring(log.indexOf(' ')+1)}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                     </div>
                )}
            </div>
        </motion.div>

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
                            onClick={() => setSelectedAlert(selectedAlertId === alert.id ? null : alert.id)}
                            className={cn(
                                "p-3 rounded-lg border backdrop-blur-md shadow-lg flex items-start gap-3 relative overflow-hidden cursor-pointer hover:bg-white/5 transition-all",
                                selectedAlertId === alert.id ? "ring-2 ring-white/50 scale-[1.02]" : "",
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
                                onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }}
                                className="text-white/40 hover:text-white transition-colors p-1"
                            >
                                ×
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
             </div>
        </div>

      </div>

      {/* Footer / Status Bar - Minimal Tech Style */}
      <footer className="pointer-events-auto flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-gray-500 mt-auto pt-2 border-t border-white/5 opacity-80 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM ONLINE</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10"></div>
            <div>LAT: 54.2°N  LON: 12.1°E</div>
         </div>
         <div className="flex items-center gap-4">
             <div className="text-cyan-400">SECURE LINK ESTABLISHED</div>
             <div className="h-3 w-[1px] bg-white/10"></div>
             <div>OP_MODE: PASSIVE</div>
         </div>
      </footer>

      {/* Analysis Popup Modal */}
      <AnimatePresence>
        {isAnalysisOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="pointer-events-auto bg-[#050a10]/95 backdrop-blur-2xl border border-cyan-500/20 rounded-sm p-0 w-[450px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                    {/* Technical Header */}
                    <div className="flex justify-between items-stretch h-10 border-b border-white/10 bg-white/5">
                         <div className="flex items-center px-4 gap-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                            <h2 className="text-xs font-bold text-white tracking-widest">SIGNAL ANALYSIS</h2>
                            <span className="text-[9px] text-cyan-500/50 font-mono ml-2 border-l border-white/10 pl-2">ID: SAT-GNSS-4042</span>
                         </div>
                         <button 
                            onClick={() => setAnalysisOpen(false)}
                            className="w-10 hover:bg-red-500/20 hover:text-red-400 text-white/40 flex items-center justify-center transition-colors border-l border-white/10"
                         >
                            ✕
                         </button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-2 border border-white/5 relative group">
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-[9px] text-gray-500 font-mono mb-1 tracking-wider">REAL POWER</div>
                                <div className="text-xl font-mono text-emerald-400 text-shadow-glow">-142 dBm</div>
                            </div>
                            <div className="bg-black/40 p-2 border border-white/5">
                                <div className="text-[9px] text-gray-500 font-mono mb-1 tracking-wider">NOISE FLOOR</div>
                                <div className="text-xl font-mono text-rose-400">-168 dBm</div>
                            </div>
                        </div>
                        
                        {/* Mathematical Framework - Replacing Graph */}
                        <div className="space-y-3 mb-4">
                            {/* Kelvin Wake Analysis */}
                            <div className="bg-white/5 border border-white/10 rounded p-3 relative overflow-hidden">
                                <div className="flex justify-between items-baseline mb-2">
                                     <h4 className="text-[10px] text-cyan-400 font-bold tracking-widest">KELVIN WAKE ANALYSIS</h4>
                                     <span className="text-[8px] text-gray-500 font-mono">HYDRODYNAMICS</span>
                                </div>
                                <div className="font-mono text-xs text-center text-white py-3 bg-black/20 rounded mb-2 border border-white/5 shadow-inner">
                                     θ_cusp = arcsin(1/3) ≈ 19.47°
                                </div>
                                <div className="text-[9px] text-gray-400 leading-relaxed text-justify">
                                    Doppler spectrum analysis reveals transverse and divergent wave components consistent with a moving hull.
                                </div>
                            </div>

                            {/* Comparison Models */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded p-2 opacity-60">
                                     <div className="text-[8px] text-gray-500 uppercase mb-1">Ocean Clutter</div>
                                     <div className="font-mono text-white text-xs">Isotropic</div>
                                     <div className="text-[8px] text-gray-400 mt-1">Random Roughness</div>
                                </div>
                                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-2">
                                     <div className="text-[8px] text-emerald-500 uppercase mb-1">Wake Signature</div>
                                     <div className="font-mono text-emerald-300 text-xs">Anisotropic</div>
                                     <div className="text-[8px] text-emerald-500 mt-1">Directional Pattern</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Wake Metrics */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-xs text-gray-400 border-b border-white/10 pb-2">
                                <span>WAKE GEOMETRY ESTIMATION</span>
                                <span className="font-mono text-[10px]">RADAR CROSS SECTION</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="text-gray-500 mb-1">Vessel Speed (v)</div>
                                    <div className="font-mono text-cyan-300">18.4 kts</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 mb-1">Wake Angle (&alpha;)</div>
                                    <div className="font-mono text-orange-300">19.2°</div>
                                </div>
                            </div>

                            <div className="bg-black/40 p-2 rounded border border-white/5">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-gray-400">Estimated Length</span>
                                    <span className="text-[10px] text-gray-500 italic">L = v² / (g * Froude)</span>
                                </div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    142.5 m
                                </div>
                                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                                     VESSEL SIGNATURE CONFIRMED
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded text-xs text-cyan-200 leading-relaxed">
                            <strong className="text-cyan-400 block mb-1">AI INSIGHT</strong>
                            Anomalous surface roughness detected. Coherent wake structure suggests a non-cooperative vessel moving NW. Dark Vessel Detection confidence: 94%.
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
