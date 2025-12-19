import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../hooks/useDatabase'
import {
  // General icons
  Menu,
  Home,
  Users,
  FileText,
  Settings,
  Search,
  X,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  UserPlus,
  FileArchive,
  Database,
  Cpu,
  Globe
} from 'lucide-react'

const Dashboard = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState(null)
  const [expandedHouseholdId, setExpandedHouseholdId] = useState(null)
  const { 
    getAllHouseholds, 
    searchHouseholds, 
    getStatistics,
    getHouseholdById,
    loading
  } = useDatabase()
  const [households, setHouseholds] = useState([])
  const [expandedHouseholdDetails, setExpandedHouseholdDetails] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 300)
    loadDashboardData()
    return () => clearTimeout(timer)
  }, [])

  const loadDashboardData = async () => {
    // Load statistics
    const statsResult = await getStatistics()
    if (statsResult.success) {
      setStats(statsResult.data)
    }

    // Load households (up to 20)
    const householdsResult = await getAllHouseholds()
    if (householdsResult.success && householdsResult.data) {
      // Show only up to 20 items
      const limitedData = householdsResult.data.slice(0, 20)
      setHouseholds(limitedData)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      // If search is empty, reload all households
      await loadDashboardData()
      return
    }

    const result = await searchHouseholds(searchTerm)
    if (result.success && result.data) {
      // Limit to 20 results
      const limitedResults = result.data.slice(0, 20)
      setHouseholds(limitedResults)
      // Clear expanded details on new search
      setExpandedHouseholdDetails({})
      setExpandedHouseholdId(null)
    }
  }

  const handleClearSearch = async () => {
    setSearchTerm('')
    await loadDashboardData()
    setExpandedHouseholdDetails({})
    setExpandedHouseholdId(null)
  }

  const toggleHouseholdDetails = async (householdId) => {
    if (expandedHouseholdId === householdId) {
      setExpandedHouseholdId(null)
    } else {
      setExpandedHouseholdId(householdId)
      
      // If we haven't loaded the detailed data yet, fetch it
      if (!expandedHouseholdDetails[householdId]) {
        const result = await getHouseholdById(householdId)
        if (result.success && result.data) {
          setExpandedHouseholdDetails(prev => ({
            ...prev,
            [householdId]: result.data
          }))
        }
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden select-none">
      {/* Windows-style Title Bar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
              <Menu className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-300 font-medium text-sm"><span className="text-amber-300">Cen</span>Drive v1.0</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Navigation */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-6">
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-gray-300 font-semibold mb-2"><span className="text-amber-300">Cen</span>Drive</h3>
            <p className="text-gray-500 text-sm">Data Managenebt System</p>
          </div>

          <div className="space-y-2">
            <Link to="/dashboard" className="block p-3 bg-gray-700/30 rounded-lg border-l-4 border-cyan-500">
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-gray-300" />
                <span className="text-gray-300 font-medium">Dashboard</span>
              </div>
            </Link>
            <Link to="/data-entry" className="block p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400">Data Entry</span>
              </div>
            </Link>
            <Link to="/reports" className="block p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Reports</span>
              </div>
            </Link>
            <Link to="/settings" className="block p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Settings</span>
              </div>
            </Link>
          </div>

          {/* Database Stats in Sidebar */}
          {stats && (
            <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <h4 className="text-gray-300 font-medium mb-3 text-sm flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Database Stats</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs flex items-center space-x-2">
                    <Home className="w-3 h-3" />
                    <span>Households:</span>
                  </span>
                  <span className="text-cyan-400 font-medium">{stats.total_households || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs flex items-center space-x-2">
                    <Users className="w-3 h-3" />
                    <span>Family Members:</span>
                  </span>
                  <span className="text-cyan-400 font-medium">{stats.total_family_members || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs flex items-center space-x-2">
                    <User className="w-3 h-3" />
                    <span>Avg Family Size:</span>
                  </span>
                  <span className="text-cyan-400 font-medium">
                    {stats.avg_family_size ? Math.round(stats.avg_family_size * 10) / 10 : 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header with Search */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                    <span className="text-amber-300">Cen</span>Drive
                  </h1>
                  <p className="text-gray-400">
                    {households.length} household{households.length !== 1 ? 's' : ''} displayed
                    {searchTerm && ` • Search results for "${searchTerm}"`}
                  </p>
                </div>
                
                <form onSubmit={handleSearch} className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search households..."
                      className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-64"
                    />
                    <Search className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{loading ? 'Searching...' : 'Search'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Households List Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                  <p className="text-gray-400">Loading census data...</p>
                </div>
              </div>
            ) : households.length > 0 ? (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden mb-8">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 bg-gray-800/50 text-gray-400 text-sm font-medium">
                  <div className="col-span-3">Household Head</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-3">Address</div>
                  <div className="col-span-2">Family Members</div>
                  <div className="col-span-1">Date Added</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Household Rows */}
                <div className="divide-y divide-gray-700/50">
                  {households.map((household) => (
                    <div key={household.id}>
                      {/* Main Household Row */}
                      <div className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-800/20 transition-colors duration-200">
                        {/* Name Column */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                              <span className="text-cyan-300 font-bold">
                                {household.first_name?.charAt(0) || ''}{household.last_name?.charAt(0) || ''}
                              </span>
                            </div>
                            <div>
                              <div className="text-gray-300 font-medium">
                                {household.first_name} {household.middle_name ? `${household.middle_name.charAt(0)}. ` : ''}{household.last_name}
                                {household.extension && ` ${household.extension}`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Column */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            {household.contact_number && (
                              <div className="text-gray-300 text-sm flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{household.contact_number}</span>
                              </div>
                            )}
                            {household.email_address && (
                              <div className="text-gray-300 text-sm flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{household.email_address}</span>
                              </div>
                            )}
                            {!household.contact_number && !household.email_address && (
                              <span className="text-gray-500 text-sm">No contact info</span>
                            )}
                          </div>
                        </div>

                        {/* Address Column */}
                        <div className="col-span-3">
                          <div className="space-y-1">
                            {(household.house_no || household.street_name) && (
                              <div className="text-gray-300 text-sm">
                                {household.house_no} {[household.street_name, household.barangay].filter(Boolean).join(', ')}
                              </div>
                            )}
                            {(household.town || household.province || household.region || household.zip_code) && (
                              <div className="text-gray-500 text-sm">
                                {[household.town, household.province, household.region, household.zip_code].filter(Boolean).join(', ')}
                              </div>
                            )}
                            {!household.house_no && !household.street_name && !household.town && !household.province && (
                              <span className="text-gray-500 text-sm">No address provided</span>
                            )}
                          </div>
                        </div>

                        {/* Family Members Column */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${household.family_count > 0 ? 'bg-cyan-500/10 text-cyan-300' : 'bg-gray-700/50 text-gray-400'}`}>
                              {household.family_count || 0} member{household.family_count !== 1 ? 's' : ''}
                            </div>
                            {household.family_count > 0 && (
                              <button
                                onClick={() => toggleHouseholdDetails(household.id)}
                                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center space-x-1"
                              >
                                <span>{expandedHouseholdId === household.id ? 'Hide' : 'Show'}</span>
                                {expandedHouseholdId === household.id ? (
                                  <ChevronDown className="w-4 h-4 transition-transform" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 transition-transform" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Date Added Column */}
                        <div className="col-span-1">
                          <div className="text-gray-500 text-sm">
                            {formatDate(household.created_at)}
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-1 text-right">
                          <Link 
                            to={`/household/${household.id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>

                      {/* Expanded Family Members Section */}
                      {expandedHouseholdId === household.id && (
                        <div className="bg-gray-900/50 border-t border-gray-700 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-gray-300 font-medium text-lg flex items-center space-x-2">
                              <Users className="w-5 h-5" />
                              <span>Family Members</span>
                            </h4>
                            <span className="text-cyan-400 text-sm">
                              Total: {expandedHouseholdDetails[household.id]?.familyMembers?.length || household.family_count || 0}
                            </span>
                          </div>
                          
                          {expandedHouseholdDetails[household.id]?.familyMembers?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {expandedHouseholdDetails[household.id].familyMembers.map((member, index) => (
                                <div key={member.id || index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600">
                                      <span className="text-gray-300 text-xs font-bold">
                                        {member.first_name?.charAt(0) || ''}{member.last_name?.charAt(0) || ''}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-gray-300 font-medium">
                                        {member.first_name} {member.last_name}
                                      </div>
                                      <div className="text-gray-500 text-xs capitalize">
                                        {member.relationship}
                                      </div>
                                    </div>
                                  </div>
                                  {member.age && (
                                    <div className="text-sm text-gray-400">
                                      Age: {member.age}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-500">No family members recorded for this household</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* List Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50 text-gray-500 text-sm">
                  Showing {households.length} household{households.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center border border-gray-700">
                  <FileText className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-2">
                  {searchTerm ? 'No matching households found' : 'No households in database'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? `No households found matching "${searchTerm}". Try a different search term or clear the search.`
                    : 'Start by adding your first census household record to the database.'
                  }
                </p>
                {!searchTerm && (
                  <Link
                    to="/data-entry"
                    className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 border border-cyan-500/30"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add First Household
                  </Link>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Quick Actions</h3>
                  <p className="text-gray-400 text-sm">
                    {households.length > 0 
                      ? `Manage ${households.length} household records in your database` 
                      : 'Start building your census database'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={loadDashboardData}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                  
                  <Link
                    to="/data-entry"
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 border border-cyan-500/30 flex items-center space-x-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Record</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <div className="flex items-center space-x-6">
                  <span>© 2024 <span className="text-amber-300">Cen</span>Drive Desktop</span>
                  <span>•</span>
                  <span>Windows Desktop Application</span>
                  <span>•</span>
                  <span>Version 1.0.0</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>SQLite v3.40+</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4" />
                    <span>Electron v28</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400 text-sm">
              Database: {loading ? 'Loading...' : 'Ready'} • {households.length} records
            </span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm flex items-center space-x-2">
            <FileArchive className="w-3 h-3" />
            <span>Local Storage: Active</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm flex items-center space-x-2">
            <Globe className="w-3 h-3" />
            <span>Desktop Mode</span>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm">Windows x64</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard