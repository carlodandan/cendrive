import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  const [waves, setWaves] = useState([])

  useEffect(() => {
    // Create wave animation
    const waveElements = []
    for (let i = 0; i < 10; i++) {
      waveElements.push({
        id: i,
        size: 100 + i * 20,
        opacity: 0.1 + (i * 0.08),
        delay: i * 0.3
      })
    }
    setWaves(waveElements)
  }, [])

  const [appInfo, setAppInfo] = useState({
    app: '',
    runtime: {
      electron: '',
      node: '',
      chrome: '',
    },
    libs: {
      betterSqlite3: '',
    },
  });

  useEffect(() => {
    async function loadInfo() {
      const info = await window.electronAPI.getAppInfo();
      setAppInfo(info);
    }
    loadInfo();
  }, []);


  return (
    <div className="min-h-screen bg-linear-to-br from-[rgb(var(--bg))] via-[rgb(var(--card))] to-[rgb(var(--bg))] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Animated Waves */}
      <div className="relative w-96 h-96 flex items-center justify-center">
        {waves.map((wave) => (
          <div
            key={wave.id}
            className="absolute rounded-full border-4 border-cyan-400/30 animate-ping"
            style={{
              width: wave.size,
              height: wave.size,
              opacity: wave.opacity,
              animationDelay: `${wave.delay}s`,
              animationDuration: '3s'
            }}
          />
        ))}
        
        {/* Database Icon */}
        <div className="relative z-10">
          <div className="w-48 h-64 bg-linear-to-b from-cyan-500 to-blue-600 rounded-lg flex flex-col items-center justify-center p-6 shadow-2xl shadow-cyan-500/30 border-2 border-cyan-400/50">
            {/* Database Cylinder */}
            <div className="w-40 h-32 bg-linear-to-b from-cyan-400 to-blue-500 rounded-t-lg relative overflow-hidden">
              {/* Database rings */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-cyan-300/50"></div>
              <div className="absolute top-12 left-0 right-0 h-1 bg-cyan-300/50"></div>
              <div className="absolute top-20 left-0 right-0 h-1 bg-cyan-300/50"></div>
              
              {/* Data lines */}
              <div className="absolute top-8 left-4 right-4 h-0.5 bg-cyan-300/30"></div>
              <div className="absolute top-10 left-4 right-4 h-0.5 bg-cyan-300/30"></div>
              <div className="absolute top-16 left-4 right-4 h-0.5 bg-cyan-300/30"></div>
              <div className="absolute top-24 left-4 right-4 h-0.5 bg-cyan-300/30"></div>
            </div>
            
            {/* Database Base */}
            <div className="w-44 h-8 bg-linear-to-b from-blue-600 to-blue-800 rounded-b-lg"></div>
            
            {/* Shine effect */}
            <div className="absolute top-2 left-4 w-16 h-3 bg-cyan-300/20 rounded-full blur-sm"></div>
          </div>
        </div>
      </div>

      {/* App Title */}
      <div className="text-center">
        <h1 className="text-6xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4 tracking-tight">
          <span className="text-amber-300">Cen</span>Drive
        </h1>
        <p className="text-xl text-cyan-200/80 mb-2 font-light">
          Data Management System
        </p>
        <p className="text-lg text-cyan-200/60 mb-2 max-w-2xl">
          Secure, efficient, and modern solution for managing census data with real-time storage and retrieval
        </p>
      </div>

      {/* Get Started Button - Now using Link */}
      <Link
        to="/dashboard"
        className="mt-4 px-12 py-4 bg-linear-to-r from-cyan-600 to-blue-700 text-[rgb(var(--blight))] text-xl font-semibold rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 border-2 border-cyan-400/30 inline-flex items-center space-x-3"
      >
        <span>Get Started</span>
        <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>

      {/* Footer */}
      <div className="mt-16 text-center text-cyan-200/40 text-sm">
        <p><span className="text-amber-300">Cen</span>Drive {appInfo.app} • Built with Electron & React • Data stays on your device</p>
      </div>
    </div>
  )
}

export default LandingPage