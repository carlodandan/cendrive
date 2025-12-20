import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatabase } from '../hooks/useDatabase'
import Sidebar from '../components/Sidebar'
import {
  Home,
  BarChart3,
  MapPin,
  Users,
  Building,
  Globe,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  PieChart,
  TrendingUp,
  Building2,
  Flag,
  RefreshCw,
  Calendar,
  FileText,
  Database
} from 'lucide-react'

const Reports = () => {
  const { getAllHouseholds, loading } = useDatabase()
  const [households, setHouseholds] = useState([])
  const [analytics, setAnalytics] = useState({
    byRegion: [],
    byProvince: [],
    byTown: [],
    summary: null,
    timeStats: null
  })
  const [expandedSections, setExpandedSections] = useState({
    region: true,
    province: true,
    town: true
  })
  const [timeFilter, setTimeFilter] = useState('all') // 'all', 'month', 'week'

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (households.length > 0) {
      calculateAnalytics()
    }
  }, [households, timeFilter])

  const loadData = async () => {
    const result = await getAllHouseholds()
    if (result.success && result.data) {
      setHouseholds(result.data)
    }
  }

  const calculateAnalytics = () => {
    const filteredHouseholds = filterByTime(households, timeFilter)
    
    const byRegion = {}
    const byProvince = {}
    const byTown = {}
    let totalFamilyMembers = 0
    
    filteredHouseholds.forEach(household => {
      totalFamilyMembers += (household.family_count || 0)
      
      // Count by region
      const region = household.region || 'Unspecified'
      byRegion[region] = (byRegion[region] || { count: 0, towns: new Set(), provinces: new Set() })
      byRegion[region].count += 1
      if (household.town) byRegion[region].towns.add(household.town)
      if (household.province) byRegion[region].provinces.add(household.province)
      
      // Count by province
      if (household.province) {
        const provinceKey = household.province
        byProvince[provinceKey] = (byProvince[provinceKey] || { count: 0, towns: new Set(), region: household.region || 'Unspecified' })
        byProvince[provinceKey].count += 1
        if (household.town) byProvince[provinceKey].towns.add(household.town)
      }
      
      // Count by town
      if (household.town) {
        const townKey = `${household.town}${household.province ? `, ${household.province}` : ''}`
        byTown[townKey] = (byTown[townKey] || { 
          count: 0, 
          province: household.province || 'Unspecified',
          region: household.region || 'Unspecified'
        })
        byTown[townKey].count += 1
      }
    })

    // Convert to arrays and sort
    const sortedRegions = Object.entries(byRegion)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        townsCount: data.towns.size,
        provincesCount: data.provinces.size,
        percentage: filteredHouseholds.length > 0 ? (data.count / filteredHouseholds.length * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count)

    const sortedProvinces = Object.entries(byProvince)
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        townsCount: data.towns.size,
        region: data.region,
        percentage: filteredHouseholds.length > 0 ? (data.count / filteredHouseholds.length * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count)

    const sortedTowns = Object.entries(byTown)
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        province: data.province,
        region: data.region,
        percentage: filteredHouseholds.length > 0 ? (data.count / filteredHouseholds.length * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate time-based statistics
    const timeStats = calculateTimeStats(filteredHouseholds)

    setAnalytics({
      byRegion: sortedRegions,
      byProvince: sortedProvinces,
      byTown: sortedTowns,
      summary: {
        totalHouseholds: filteredHouseholds.length,
        totalFamilyMembers: totalFamilyMembers,
        totalRegions: sortedRegions.length,
        totalProvinces: sortedProvinces.length,
        totalTowns: sortedTowns.length,
        avgPerRegion: filteredHouseholds.length > 0 ? (filteredHouseholds.length / Math.max(sortedRegions.length, 1)).toFixed(1) : '0.0',
        avgPerProvince: filteredHouseholds.length > 0 ? (filteredHouseholds.length / Math.max(sortedProvinces.length, 1)).toFixed(1) : '0.0',
        avgFamilySize: filteredHouseholds.length > 0 ? (totalFamilyMembers / filteredHouseholds.length).toFixed(1) : '0.0'
      },
      timeStats
    })
  }

  const filterByTime = (data, filter) => {
    if (filter === 'all') return data
    
    const now = new Date()
    let cutoffDate = new Date()
    
    if (filter === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1)
    } else if (filter === 'week') {
      cutoffDate.setDate(now.getDate() - 7)
    }
    
    return data.filter(household => {
      const createdDate = new Date(household.created_at)
      return createdDate >= cutoffDate
    })
  }

  const calculateTimeStats = (data) => {
    if (data.length === 0) return null
    
    const now = new Date()
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7))
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1))
    
    const weekly = data.filter(h => new Date(h.created_at) >= oneWeekAgo).length
    const monthly = data.filter(h => new Date(h.created_at) >= oneMonthAgo).length
    
    return {
      weekly,
      monthly,
      weeklyPercentage: data.length > 0 ? ((weekly / data.length) * 100).toFixed(1) : '0.0',
      monthlyPercentage: data.length > 0 ? ((monthly / data.length) * 100).toFixed(1) : '0.0'
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const exportToCSV = () => {
    const headers = ['Region', 'Province', 'Town', 'Households', 'Family Members', 'Percentage', 'Average Family Size']
    const rows = []
    
    analytics.byRegion.forEach(region => {
      const regionHouseholds = households.filter(h => h.region === region.name)
      const avgFamilySize = regionHouseholds.length > 0 
        ? (regionHouseholds.reduce((sum, h) => sum + (h.family_count || 0), 0) / regionHouseholds.length).toFixed(1)
        : '0.0'
      
      rows.push([
        region.name,
        'All',
        'All',
        region.count,
        regionHouseholds.reduce((sum, h) => sum + (h.family_count || 0), 0),
        `${region.percentage}%`,
        avgFamilySize
      ])
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cendrive-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getColorForPercentage = (percentage) => {
    const perc = parseFloat(percentage)
    if (perc >= 30) return 'from-red-500 to-orange-500'
    if (perc >= 20) return 'from-orange-500 to-yellow-500'
    if (perc >= 10) return 'from-green-500 to-emerald-500'
    return 'from-blue-500 to-cyan-500'
  }

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0'
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Windows-style Title Bar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-300 font-medium text-sm"><span className="text-amber-300">Cen</span>Drive Reports</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard"
            className="text-gray-400 hover:text-gray-300 text-sm flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar pageType="reports" />

        {/* Main Content Area - Make this scrollable */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-8xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                    Census Analytics & Reports
                  </h1>
                  <p className="text-gray-400">
                    Real-time geographical analysis from database • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timeFilter === 'all' 
                          ? 'bg-cyan-600 text-white' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setTimeFilter('month')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timeFilter === 'month' 
                          ? 'bg-cyan-600 text-white' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Last Month
                    </button>
                    <button
                      onClick={() => setTimeFilter('week')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timeFilter === 'week' 
                          ? 'bg-cyan-600 text-white' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Last Week
                    </button>
                  </div>
                  
                  <button
                    onClick={exportToCSV}
                    disabled={loading || households.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <span className="text-gray-300 font-medium">Database Status</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{formatNumber(households.length)}</div>
                      <div className="text-gray-400 text-xs">Total Households</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Sections */}
            <div className="space-y-8">
              {/* Regional Analysis */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div 
                  className="p-6 bg-gray-800/50 border-b border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
                  onClick={() => toggleSection('region')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <h2 className="text-xl font-bold text-gray-300">Regional Analysis</h2>
                      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-medium rounded-full">
                        {analytics.byRegion.length} regions
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-300">
                      {expandedSections.region ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Distribution of households across different regions • Based on {households.length} records
                  </p>
                </div>

                {expandedSections.region && (
                  <div className="p-6">
                    {analytics.byRegion.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.byRegion.map((region, index) => {
                          const regionHouseholds = households.filter(h => h.region === region.name)
                          const totalFamilyMembers = regionHouseholds.reduce((sum, h) => sum + (h.family_count || 0), 0)
                          
                          return (
                            <div key={region.name} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                    <span className="text-blue-300 font-bold text-lg">{index + 1}</span>
                                  </div>
                                  <div>
                                    <h3 className="text-gray-300 font-medium">{region.name}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span className="flex items-center space-x-1">
                                        <Building2 className="w-4 h-4" />
                                        <span>{region.count} households</span>
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{totalFamilyMembers} family members</span>
                                      </span>
                                      <span>•</span>
                                      <span>{region.townsCount} towns</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="mb-2">
                                    <div className={`px-3 py-1.5 bg-gradient-to-r ${getColorForPercentage(parseFloat(region.percentage))} text-white text-sm font-medium rounded-full`}>
                                      {region.percentage}% • Rank #{index + 1}
                                    </div>
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    Avg: {(totalFamilyMembers / region.count).toFixed(1)} members/household
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${getColorForPercentage(parseFloat(region.percentage))}`}
                                  style={{ width: `${Math.min(parseFloat(region.percentage) * 2, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No regional data available</p>
                        <p className="text-gray-400 text-sm mt-1">Add households with region information to see analytics</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Provincial Analysis */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div 
                  className="p-6 bg-gray-800/50 border-b border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
                  onClick={() => toggleSection('province')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Flag className="w-5 h-5 text-green-400" />
                      <h2 className="text-xl font-bold text-gray-300">Provincial Analysis</h2>
                      <span className="px-3 py-1 bg-green-500/10 text-green-300 text-xs font-medium rounded-full">
                        {analytics.byProvince.length} provinces
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-300">
                      {expandedSections.province ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Household distribution by province • Showing {timeFilter === 'all' ? 'all time' : timeFilter === 'month' ? 'last month' : 'last week'} data
                  </p>
                </div>

                {expandedSections.province && (
                  <div className="p-6">
                    {analytics.byProvince.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analytics.byProvince.map((province, index) => {
                          const provinceHouseholds = households.filter(h => h.province === province.name)
                          const totalFamilyMembers = provinceHouseholds.reduce((sum, h) => sum + (h.family_count || 0), 0)
                          
                          return (
                            <div key={province.name} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-gray-300 font-medium">{province.name}</h3>
                                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                      {province.region}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500 space-y-1">
                                    <div className="flex items-center space-x-3">
                                      <span>{province.count} households</span>
                                      <span>•</span>
                                      <span>{totalFamilyMembers} family members</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span>{province.townsCount} towns</span>
                                      <span>•</span>
                                      <span>{province.percentage}% of total</span>
                                    </div>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 bg-gradient-to-r ${getColorForPercentage(parseFloat(province.percentage))} text-white text-xs font-medium rounded-full`}>
                                  #{index + 1}
                                </div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full bg-gradient-to-r ${getColorForPercentage(parseFloat(province.percentage))}`}
                                  style={{ width: `${Math.min(parseFloat(province.percentage) * 3, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No provincial data available</p>
                        <p className="text-gray-400 text-sm mt-1">Add households with province information to see analytics</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Town/City Analysis */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <div 
                  className="p-6 bg-gray-800/50 border-b border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
                  onClick={() => toggleSection('town')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold text-gray-300">Town/City Analysis</h2>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-300 text-xs font-medium rounded-full">
                        {analytics.byTown.length} towns/cities
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-300">
                      {expandedSections.town ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Detailed breakdown by town or city • Top 20 shown
                  </p>
                </div>

                {expandedSections.town && (
                  <div className="p-6">
                    {analytics.byTown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                              <th className="pb-3 font-medium text-left">Town/City</th>
                              <th className="pb-3 font-medium text-left">Province</th>
                              <th className="pb-3 font-medium text-center">Households</th>
                              <th className="pb-3 font-medium text-center">Percentage</th>
                              <th className="pb-3 font-medium text-center">Rank</th>
                              <th className="pb-3 font-medium text-right">Distribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700/50">
                            {analytics.byTown.slice(0, 20).map((town, index) => {
                              const townHouseholds = households.filter(h => 
                                h.town === town.name.split(',')[0].trim() && 
                                h.province === town.province
                              )
                              const totalFamilyMembers = townHouseholds.reduce((sum, h) => sum + (h.family_count || 0), 0)
                              
                              return (
                                <tr key={`${town.name}-${index}`} className="hover:bg-gray-800/30">
                                  <td className="py-3 text-gray-300">{town.name.split(',')[0].trim()}</td>
                                  <td className="py-3 text-gray-400">{town.province}</td>
                                  <td className="py-3 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs mb-1">
                                        {town.count} households
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {totalFamilyMembers} members
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-center text-cyan-400 font-medium">
                                    {town.percentage}%
                                  </td>
                                  <td className="py-3 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      index < 3 
                                        ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/40 text-yellow-300' 
                                        : 'bg-gray-700/50 text-gray-400'
                                    }`}>
                                      #{index + 1}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center justify-end space-x-2">
                                      <div className="text-xs text-gray-500 w-16 text-right">
                                        {town.percentage}%
                                      </div>
                                      <div className="w-32 bg-gray-700 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full bg-gradient-to-r ${getColorForPercentage(parseFloat(town.percentage))}`}
                                          style={{ width: `${Math.min(parseFloat(town.percentage) * 5, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {analytics.byTown.length > 20 && (
                          <div className="text-center mt-4 text-gray-400 text-sm">
                            Showing top 20 of {analytics.byTown.length} towns/cities
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No town/city data available</p>
                        <p className="text-gray-400 text-sm mt-1">Add households with town information to see analytics</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Data Summary */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Data Summary</h3>
                  <p className="text-gray-400 text-sm">
                    {analytics.summary ? 
                      `Analyzed ${analytics.summary.totalHouseholds} households with ${analytics.summary.totalFamilyMembers} family members across ${analytics.summary.totalRegions} regions.` 
                      : 'Loading data summary...'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {households.length}
                    </div>
                    <div className="text-gray-400 text-xs">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {analytics.summary?.totalFamilyMembers || '0'}
                    </div>
                    <div className="text-gray-400 text-xs">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {analytics.summary?.totalRegions || '0'}
                    </div>
                    <div className="text-gray-400 text-xs">Regions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <div className="flex items-center space-x-6">
                  <span>© 2024 <span className="text-amber-300">Cen</span>Drive Reports</span>
                  <span>•</span>
                  <span>Data updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span>•</span>
                  <span>Live Database Analytics</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>SQLite3 Database</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Real-time Analytics</span>
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
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-gray-400 text-sm">
              {loading ? 'Loading data...' : `Reports: Ready • ${households.length} households analyzed`}
            </span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm">
            Filter: {timeFilter === 'all' ? 'All Time' : timeFilter === 'month' ? 'Last Month' : 'Last Week'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">
            {analytics.byRegion.length} regions • {analytics.byProvince.length} provinces • {analytics.byTown.length} towns
          </span>
        </div>
      </div>
    </div>
  )
}

export default Reports