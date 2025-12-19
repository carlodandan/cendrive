import React from 'react'
import { Link } from 'react-router-dom'

const Reports = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Reports Page</h1>
      <p className="mb-4">Analytics and reports will go here.</p>
      <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300">
        ← Back to Dashboard
      </Link>
    </div>
  )
}

export default Reports