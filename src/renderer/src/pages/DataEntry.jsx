import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatabase } from '../hooks/useDatabase'
import { useRegionData } from '../hooks/useRegionData'
import Sidebar from '../components/Sidebar'
import {
  // Navigation icons
  Menu,
  Home,
  UserPlus,
  FileText,
  Settings,
  ArrowLeft,
  Edit2,
  
  // Form icons
  User,
  MapPin,
  Phone,
  Mail,
  Users,
  Plus,
  X,
  Save,
  Trash2,
  
  // Status icons
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  
  // Loading/UI
  Loader2,
  CircleHelp,
  ChevronDown,
  Search
} from 'lucide-react'

const DataEntry = () => {
  const navigate = useNavigate()
  const { 
    saveCensusRecord, 
    loading: dbLoading, 
    error: dbError 
  } = useDatabase()
  
  const {
    regions,
    regionType,
    provinces,
    municipalities,
    selectedZipCode,
    loading: regionLoading,
    error: regionError,
    loadProvinces,
    loadMunicipalities,
    loadZipCode,
    autoSelectedProvince
  } = useRegionData()

  const [familyMembers, setFamilyMembers] = useState([])
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    extension: '',
    houseNo: '',
    streetName: '',
    barangay: '',
    region: '',
    regionSlug: '',
    province: '',
    town: '',
    zipCode: '',
    contactNumber: '',
    emailAddress: '',
  })

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    relationship: '',
    age: ''
  })

  // Handle region selection
  const handleRegionChange = async (e) => {
    const selectedValue = e.target.value
    const [regionName, regionSlug] = selectedValue.split('|')
    
    setFormData(prev => ({
      ...prev,
      region: regionName,
      regionSlug,
      province: '',
      town: '',
      zipCode: ''
    }))
    
    // Get potential auto-selected province
    const autoProvince = await loadProvinces(regionSlug)
    
    if (autoProvince) {
      // The province will be auto-set by the useEffect above
    }
  }

  // Handle province selection
  const handleProvinceChange = (e) => {
    const provinceName = e.target.value
    
    setFormData(prev => ({
      ...prev,
      province: provinceName,
      town: '',
      zipCode: ''
    }))
    
    loadMunicipalities(formData.regionSlug, provinceName)
  }

  // Handle town/city selection
  const handleTownChange = (e) => {
    const townName = e.target.value
    
    setFormData(prev => ({
      ...prev,
      town: townName,
      zipCode: ''
    }))
    
    loadZipCode(formData.regionSlug, formData.province, townName)
  }

  // Update zip code when selectedZipCode changes
  useEffect(() => {
    if (selectedZipCode && formData.town) {
      setFormData(prev => ({
        ...prev,
        zipCode: selectedZipCode
      }))
    }
  }, [selectedZipCode, formData.town])

  useEffect(() => {
    if (autoSelectedProvince && formData.regionSlug) {
      // Auto-fill the province field for city-based regions
      setFormData(prev => ({
        ...prev,
        province: autoSelectedProvince
      }))
      
      // Automatically load municipalities for the auto-selected province
      loadMunicipalities(formData.regionSlug, autoSelectedProvince)
    }
  }, [autoSelectedProvince, formData.regionSlug, loadMunicipalities])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMemberChange = (e) => {
    const { name, value } = e.target
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addFamilyMember = () => {
    if (newMember.firstName.trim() && newMember.lastName.trim()) {
      setFamilyMembers(prev => [...prev, { ...newMember, id: Date.now() }])
      setNewMember({
        firstName: '',
        lastName: '',
        relationship: '',
        age: ''
      })
    }
  }

  const removeFamilyMember = (id) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('First name and last name are required!')
      return
    }

    const completeData = {
      ...formData,
      familyMembers
    }

    try {
      const result = await saveCensusRecord(completeData)
      
      if (result.success) {
        alert(`Census record saved successfully! Household ID: ${result.householdId}`)
        
        // Reset form
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          extension: '',
          houseNo: '',
          streetName: '',
          barangay: '',
          region: '',
          regionSlug: '',
          province: '',
          town: '',
          zipCode: '',
          contactNumber: '',
          emailAddress: '',
        })
        setFamilyMembers([])
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        alert(`Error saving record: ${result.error}`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      alert('An error occurred while saving the record.')
    }
  }

  return (
    <div className="h-screen w-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden select-none">
      {/* Windows-style Title Bar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-linear-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
              <Menu className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-300 font-medium text-sm">Cendrive • Data Entry</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/dashboard" className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <Sidebar pageType="data-entry" familyMembers={familyMembers} formData={formData} />

        {/* Main Form Area */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-8xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Census Data Entry
              </h1>
              <p className="text-gray-400">
                Enter household information for census records. All data is stored locally on your device.
              </p>
              {dbLoading && (
                <div className="mt-2 flex items-center text-sm text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving record...
                </div>
              )}
              {dbError && (
                <div className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Error: {dbError}</span>
                </div>
              )}
              {regionLoading && (
                <div className="mt-2 flex items-center text-sm text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading region data...
                </div>
              )}
              {regionError && (
                <div className="mt-2 text-sm text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Region Data Error: {regionError}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Card */}
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-300">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                      Personal Information
                    </div>
                  </h2>
                  <span className="text-sm text-gray-500 px-3 py-1 bg-gray-800 rounded-lg">Required</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-2">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Extension</label>
                    <select
                      name="extension"
                      value={formData.extension}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information Card */}
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-300">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      Address Information
                    </div>
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 mb-2">House No.</label>
                      <input
                        type="text"
                        name="houseNo"
                        value={formData.houseNo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        placeholder="e.g., 123"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Street Name</label>
                      <input
                        type="text"
                        name="streetName"
                        value={formData.streetName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        placeholder="e.g., Main Street"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2">Barangay</label>
                    <input
                      type="text"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="e.g., Barangay 123"
                    />
                  </div>

                  {/* Region Dropdown */}
                  <div>
                    <label className="block text-gray-300 mb-2">Region *</label>
                    <div className="relative">
                      <select
                        name="region"
                        value={`${formData.region}|${formData.regionSlug}`}
                        onChange={handleRegionChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white appearance-none pr-10"
                        required
                        disabled={regionLoading}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => {
                          // Don't check for province data here - just show all regions
                          return (
                            <option key={region.slug} value={`${region.name}|${region.slug}`}>
                              {region.name}
                            </option>
                          )
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Province Dropdown */}
                  <div>
                    <label className="block text-gray-300 mb-2">Province *</label>
                    <div className="relative">
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleProvinceChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white appearance-none pr-10"
                        required
                        disabled={!formData.region || provinces.length === 0 || autoSelectedProvince}
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => {
                          let suffix = ''
                          
                          return (
                            <option key={`${formData.regionSlug}_${province.name}`} value={province.name}>
                              {province.name}{suffix}
                            </option>
                          )
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {provinces.length === 0 && formData.region && !regionLoading && (
                      <p className="mt-1 text-sm text-yellow-400">
                        No province data available for this region
                      </p>
                    )}
                  </div>

                  {/* Town/City Dropdown */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      {autoSelectedProvince || (provinces.find(p => p.name === formData.province)?.hasCities) 
                        ? 'City/Municipality *' 
                        : 'Town/City *'}
                    </label>
                    <div className="relative">
                      <select
                        name="town"
                        value={formData.town}
                        onChange={handleTownChange}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white appearance-none pr-10"
                        required
                        disabled={!formData.province || municipalities.length === 0}
                      >
                        <option value="">
                          Select {autoSelectedProvince || (provinces.find(p => p.name === formData.province)?.hasCities) 
                            ? 'City/Municipality' 
                            : 'Town/City'}
                        </option>
                        {municipalities.map((locality) => (
                          <option key={`${formData.province}_${locality.name}`} value={locality.name}>
                            {locality.name}
                            {locality.type === 'city' && ' City'}
                            {locality.type === 'municipality'}
                            {!locality.hasZipCode && ' (No zip code)'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {municipalities.length === 0 && formData.province && !regionLoading && (
                      <p className="mt-1 text-sm text-yellow-400">
                        No {autoSelectedProvince || (provinces.find(p => p.name === formData.province)?.hasCities) 
                          ? 'city/municipality' 
                          : 'town/city'} data available
                      </p>
                    )}
                  </div>

                  {/* Zip Code Field */}
                  <div>
                    <label className="block text-gray-300 mb-2">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="Auto-filled from selection"
                      readOnly
                    />
                    {selectedZipCode && (
                      <p className="mt-1 text-sm text-green-400">
                        ✓ Zip code auto-detected
                      </p>
                    )}
                    {formData.town && !selectedZipCode && (
                      <p className="mt-1 text-sm text-yellow-400">
                        No zip code data available for this location
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-300">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Phone className="w-5 h-5 text-green-400" />
                      </div>
                      Contact Information
                    </div>
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="e.g., +63 912 345 6789"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      placeholder="e.g., name@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Family Composition Card */}
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-300">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      Family Composition
                    </div>
                  </h2>
                  <span className="text-sm text-gray-500 px-3 py-1 bg-gray-800 rounded-lg">
                    {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Add New Member Form */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Add Family Member</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={newMember.firstName}
                        onChange={handleMemberChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-white text-sm"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={newMember.lastName}
                        onChange={handleMemberChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-white text-sm"
                        placeholder="Last name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Relationship</label>
                      <select
                        name="relationship"
                        value={newMember.relationship}
                        onChange={handleMemberChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-white text-sm"
                      >
                        <option value="">Select relationship</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="sibling">Sibling</option>
                        <option value="grandfather">Grandfather</option>
                        <option value="grandmother">Grandmother</option>
                        <option value="uncle">Uncle</option>
                        <option value="aunt">Aunt</option>
                        <option value="cousin">Cousin</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={newMember.age}
                        onChange={handleMemberChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none text-white text-sm"
                        placeholder="Age"
                        min="0"
                        max="120"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addFamilyMember}
                    disabled={!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.relationship}
                    className="mt-4 px-4 py-2 bg-linear-to-r from-cyan-600 to-blue-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Member
                  </button>
                </div>

                {/* Family Members List */}
                {familyMembers.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Family Members</h3>
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mr-4">
                            <User className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-gray-300 font-medium">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="flex items-center text-sm text-gray-400">
                              <span className="capitalize">{member.relationship}</span>
                              {member.age && <span className="mx-2">•</span>}
                              {member.age && <span>{member.age} years old</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(member.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">No family members added yet.</p>
                    <p className="text-gray-500 text-sm mt-1">Use the form above to add family members.</p>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-800">
                <div className="flex items-center space-x-2">
                  <CircleHelp className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-400 text-sm">
                    All data is stored locally on your device using SQLite3.
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 border border-gray-600 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </Link>
                  <button
                    type="submit"
                    disabled={dbLoading || !formData.region || !formData.province || !formData.town}
                    className="px-8 py-3 bg-linear-to-r from-cyan-600 to-blue-700 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 border border-cyan-500/30 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {dbLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Census Record
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-400 text-sm">Database: Ready on Save</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm flex items-center space-x-2">
            <Users className="w-3 h-3" />
            <span>Form: {familyMembers.length} family members</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">Data Entry Mode</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm flex items-center space-x-2">
            <CheckCircle className="w-3 h-3" />
            <span>Auto-save: Enabled</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default DataEntry