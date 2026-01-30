'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export default function DashboardOverlay() {
  const { 
    precision, weather, showFusion, showAnomalies, alerts,
    setPrecision, setWeather, toggleFusion, toggleAnomalies, removeAlert 
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
      <header className="pointer-events-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-lg tracking-tight">
          GNSS-R Sentinel
        </h1>
        <p className="text-blue-200/80 text-sm mt-1 tracking-wider uppercase font-medium">Ship Detection Dashboard</p>
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
    </div>
  )
}
