import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import {
  Settings as SettingsIcon,
  Database,
  Shield,
  Bell,
  Palette,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Lock,
  Globe,
  FileText,
  HardDrive,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  Key,
  User,
  BellRing,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'

const Settings = () => {
  // Database Settings
  const [databaseSettings, setDatabaseSettings] = useState({
    autoBackup: true,
    backupFrequency: 'weekly', // daily, weekly, monthly
    backupLocation: 'local',
    compressBackups: true,
    keepBackupsFor: 30, // days
    enableLogging: true,
    cacheSize: 100 // MB
  })

  // Privacy & Security
  const [privacySettings, setPrivacySettings] = useState({
    requirePassword: false,
    autoLock: false,
    lockTimeout: 15, // minutes
    dataEncryption: true,
    anonymizeReports: false,
    exportPermission: true
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    backupReminders: true,
    newRecordAlerts: true,
    weeklySummary: false,
    soundEnabled: true
  })

  // UI/Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    theme: 'dark', // dark, light, system
    fontSize: 'medium', // small, medium, large
    density: 'comfortable', // compact, comfortable, spacious
    animations: true,
    showStats: true
  })

  // App Info
  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    electron: '',
    node: '',
    chrome: '',
    databasePath: '',
    storageUsage: {
      used: '0 MB',
      total: '0 MB',
      percentage: 0
    },
    lastBackup: 'Never'
  })

  // Password state
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Backup/Restore
  const [backupStatus, setBackupStatus] = useState({
    inProgress: false,
    lastBackup: null,
    error: null
  })

  // Loading state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load app info on mount
  useEffect(() => {
    loadAppInfo()
  }, [])

  const loadAppInfo = async () => {
    setLoading(true)
    try {
      // Load app info from electron
      const info = await window.electronAPI.getAppInfo()
      setAppInfo(prev => ({
        ...prev,
        version: info.app,
        electron: info.runtime.electron,
        node: info.runtime.node,
        chrome: info.runtime.chrome
      }))
    } catch (error) {
      console.error('Error loading app info:', error)
    }
    setLoading(false)
  }

  const handleDatabaseSettingChange = (key, value) => {
    setDatabaseSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePrivacySettingChange = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleNotificationSettingChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleThemeSettingChange = (key, value) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPassword(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const performBackup = async () => {
    setBackupStatus({ inProgress: true, error: null })
    try {
      // This would call the electron backend to perform backup
      const result = await window.databaseAPI.backupDatabase(`backup-${Date.now()}.db`)
      if (result.success) {
        setBackupStatus({
          inProgress: false,
          lastBackup: new Date().toISOString(),
          error: null
        })
        alert('Backup completed successfully!')
      } else {
        throw new Error(result.error || 'Backup failed')
      }
    } catch (error) {
      setBackupStatus({
        inProgress: false,
        error: error.message
      })
      alert(`Backup failed: ${error.message}`)
    }
  }

  const exportData = async () => {
    try {
      // Export data logic
      alert('Export functionality would be implemented here')
    } catch (error) {
      alert(`Export failed: ${error.message}`)
    }
  }

  const importData = async () => {
    try {
      // Import data logic
      alert('Import functionality would be implemented here')
    } catch (error) {
      alert(`Import failed: ${error.message}`)
    }
  }

  const clearCache = async () => {
    if (window.confirm('Are you sure you want to clear all cached data? This action cannot be undone.')) {
      try {
        // Clear cache logic
        alert('Cache cleared successfully!')
      } catch (error) {
        alert(`Failed to clear cache: ${error.message}`)
      }
    }
  }

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      // Reset all settings
      setDatabaseSettings({
        autoBackup: true,
        backupFrequency: 'weekly',
        backupLocation: 'local',
        compressBackups: true,
        keepBackupsFor: 30,
        enableLogging: true,
        cacheSize: 100
      })
      
      setPrivacySettings({
        requirePassword: false,
        autoLock: false,
        lockTimeout: 15,
        dataEncryption: true,
        anonymizeReports: false,
        exportPermission: true
      })
      
      setNotificationSettings({
        emailNotifications: false,
        backupReminders: true,
        newRecordAlerts: true,
        weeklySummary: false,
        soundEnabled: true
      })
      
      setThemeSettings({
        theme: 'dark',
        fontSize: 'medium',
        density: 'comfortable',
        animations: true,
        showStats: true
      })
      
      alert('Settings reset to default values!')
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save settings logic (would typically save to a config file or localStorage)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Settings saved successfully!')
    } catch (error) {
      alert(`Failed to save settings: ${error.message}`)
    }
    setSaving(false)
  }

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Windows-style Title Bar */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-300 font-medium text-sm"><span className="text-amber-300">Cen</span>Drive Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar pageType="settings" />

        {/* Settings Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Application Settings
              </h1>
              <p className="text-gray-400">
                Configure your CenDrive application preferences and manage system options
              </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              {/* Database Settings */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Database Settings</h2>
                      <p className="text-gray-400 text-sm">Configure database backup and maintenance</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Auto Backup */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Auto Backup</h3>
                        <p className="text-gray-500 text-sm">Automatically backup database</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={databaseSettings.autoBackup}
                          onChange={(e) => handleDatabaseSettingChange('autoBackup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>

                    {/* Backup Frequency */}
                    <div>
                      <label className="block text-gray-300 mb-2">Backup Frequency</label>
                      <select
                        value={databaseSettings.backupFrequency}
                        onChange={(e) => handleDatabaseSettingChange('backupFrequency', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        disabled={!databaseSettings.autoBackup}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Cache Size */}
                    <div>
                      <label className="block text-gray-300 mb-2">
                        Cache Size: {databaseSettings.cacheSize} MB
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={databaseSettings.cacheSize}
                        onChange={(e) => handleDatabaseSettingChange('cacheSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-gray-500 text-sm mt-1">
                        <span>10 MB</span>
                        <span>500 MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Backup Options */}
                  <div className="space-y-4">
                    {/* Backup Location */}
                    <div>
                      <label className="block text-gray-300 mb-2">Backup Location</label>
                      <select
                        value={databaseSettings.backupLocation}
                        onChange={(e) => handleDatabaseSettingChange('backupLocation', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                      >
                        <option value="local">Local Storage</option>
                        <option value="external">External Drive</option>
                        <option value="cloud">Cloud Storage</option>
                      </select>
                    </div>

                    {/* Keep Backups For */}
                    <div>
                      <label className="block text-gray-300 mb-2">Keep Backups For</label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={databaseSettings.keepBackupsFor}
                          onChange={(e) => handleDatabaseSettingChange('keepBackupsFor', parseInt(e.target.value))}
                          className="w-24 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        />
                        <span className="text-gray-400">days</span>
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-300 font-medium text-sm">Compress Backups</h3>
                          <p className="text-gray-500 text-xs">Reduce backup file size</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={databaseSettings.compressBackups}
                            onChange={(e) => handleDatabaseSettingChange('compressBackups', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-300 font-medium text-sm">Enable Logging</h3>
                          <p className="text-gray-500 text-xs">Log database operations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={databaseSettings.enableLogging}
                            onChange={(e) => handleDatabaseSettingChange('enableLogging', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Backup Actions */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 text-sm">
                      {backupStatus.lastBackup && (
                        <span className="text-green-400">
                          <Check className="w-4 h-4 inline mr-2" />
                          Last backup: {new Date(backupStatus.lastBackup).toLocaleString()}
                        </span>
                      )}
                      {backupStatus.error && (
                        <span className="text-red-400">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          {backupStatus.error}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={performBackup}
                        disabled={backupStatus.inProgress}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
                      >
                        {backupStatus.inProgress ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{backupStatus.inProgress ? 'Backing up...' : 'Backup Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Privacy & Security</h2>
                      <p className="text-gray-400 text-sm">Configure security and data protection</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Require Password */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Require Password</h3>
                        <p className="text-gray-500 text-sm">Password protect the application</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.requirePassword}
                          onChange={(e) => handlePrivacySettingChange('requirePassword', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>

                    {/* Auto Lock */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Auto Lock</h3>
                        <p className="text-gray-500 text-sm">Lock application after inactivity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.autoLock}
                          onChange={(e) => handlePrivacySettingChange('autoLock', e.target.checked)}
                          className="sr-only peer"
                          disabled={!privacySettings.requirePassword}
                        />
                        <div className={`w-11 h-6 rounded-full peer ${!privacySettings.requirePassword ? 'bg-gray-800' : 'bg-gray-700'} peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600`}></div>
                      </label>
                    </div>

                    {/* Lock Timeout */}
                    <div>
                      <label className="block text-gray-300 mb-2">Lock Timeout</label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={privacySettings.lockTimeout}
                          onChange={(e) => handlePrivacySettingChange('lockTimeout', parseInt(e.target.value))}
                          className="w-24 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                          disabled={!privacySettings.autoLock || !privacySettings.requirePassword}
                        />
                        <span className="text-gray-400">minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Data Encryption */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Data Encryption</h3>
                        <p className="text-gray-500 text-sm">Encrypt sensitive data at rest</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.dataEncryption}
                          onChange={(e) => handlePrivacySettingChange('dataEncryption', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>

                    {/* Anonymize Reports */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Anonymize Reports</h3>
                        <p className="text-gray-500 text-sm">Remove personal info from exports</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.anonymizeReports}
                          onChange={(e) => handlePrivacySettingChange('anonymizeReports', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>

                    {/* Export Permission */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">Export Permission</h3>
                        <p className="text-gray-500 text-sm">Require confirmation for data export</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.exportPermission}
                          onChange={(e) => handlePrivacySettingChange('exportPermission', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                {privacySettings.requirePassword && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-300 mb-4 flex items-center space-x-2">
                      <Key className="w-5 h-5" />
                      <span>Change Application Password</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="current"
                            value={password.current}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">New Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="new"
                          value={password.new}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Confirm Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirm"
                          value={password.confirm}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                        />
                      </div>
                    </div>
                    <button className="mt-4 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300">
                      Update Password
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Settings */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                      <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Notifications</h2>
                      <p className="text-gray-400 text-sm">Configure alerts and notifications</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
                    { key: 'backupReminders', label: 'Backup Reminders', description: 'Remind about scheduled backups' },
                    { key: 'newRecordAlerts', label: 'New Record Alerts', description: 'Alert when new records are added' },
                    { key: 'weeklySummary', label: 'Weekly Summary', description: 'Weekly statistics report' },
                    { key: 'soundEnabled', label: 'Sound Notifications', description: 'Play sounds for alerts' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-gray-300 font-medium">{item.label}</h3>
                        <p className="text-gray-500 text-sm">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key]}
                          onChange={(e) => handleNotificationSettingChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* UI/Theme Settings */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                      <Palette className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Appearance</h2>
                      <p className="text-gray-400 text-sm">Customize the look and feel</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                      <label className="block text-gray-300 mb-2">Theme</label>
                      <div className="flex space-x-3">
                        {[
                          { value: 'dark', icon: <Moon className="w-5 h-5" />, label: 'Dark' },
                          { value: 'light', icon: <Sun className="w-5 h-5" />, label: 'Light' },
                          { value: 'system', icon: <Monitor className="w-5 h-5" />, label: 'System' }
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => handleThemeSettingChange('theme', theme.value)}
                            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border ${
                              themeSettings.theme === theme.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-gray-700 bg-gray-800 hover:bg-gray-700/50'
                            } transition-colors`}
                          >
                            <div className={`mb-2 ${themeSettings.theme === theme.value ? 'text-cyan-400' : 'text-gray-400'}`}>
                              {theme.icon}
                            </div>
                            <span className={`text-sm font-medium ${
                              themeSettings.theme === theme.value ? 'text-cyan-300' : 'text-gray-300'
                            }`}>
                              {theme.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-gray-300 mb-2">Font Size</label>
                      <div className="flex space-x-3">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => handleThemeSettingChange('fontSize', size)}
                            className={`flex-1 py-3 rounded-lg border ${
                              themeSettings.fontSize === size
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                                : 'border-gray-700 bg-gray-800 hover:bg-gray-700/50 text-gray-300'
                            } transition-colors font-medium capitalize`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* UI Density */}
                    <div>
                      <label className="block text-gray-300 mb-2">UI Density</label>
                      <div className="flex space-x-3">
                        {['compact', 'comfortable', 'spacious'].map((density) => (
                          <button
                            key={density}
                            onClick={() => handleThemeSettingChange('density', density)}
                            className={`flex-1 py-3 rounded-lg border ${
                              themeSettings.density === density
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                                : 'border-gray-700 bg-gray-800 hover:bg-gray-700/50 text-gray-300'
                            } transition-colors font-medium capitalize`}
                          >
                            {density}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Additional UI Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-300 font-medium">Animations</h3>
                          <p className="text-gray-500 text-sm">Enable UI animations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={themeSettings.animations}
                            onChange={(e) => handleThemeSettingChange('animations', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-gray-300 font-medium">Show Stats</h3>
                          <p className="text-gray-500 text-sm">Display statistics in sidebar</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={themeSettings.showStats}
                            onChange={(e) => handleThemeSettingChange('showStats', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                      <HardDrive className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Data Management</h2>
                      <p className="text-gray-400 text-sm">Manage application data and storage</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Export Data */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Download className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-gray-300 font-medium">Export Data</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Export all census data to CSV format</p>
                    <button
                      onClick={exportData}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300"
                    >
                      Export All Data
                    </button>
                  </div>

                  {/* Import Data */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Upload className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-gray-300 font-medium">Import Data</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Import census data from CSV files</p>
                    <button
                      onClick={importData}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300"
                    >
                      Import Data
                    </button>
                  </div>

                  {/* Clear Cache */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </div>
                      <h3 className="text-gray-300 font-medium">Clear Cache</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Clear temporary files and cached data</p>
                    <button
                      onClick={clearCache}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-medium rounded-lg hover:from-red-500 hover:to-rose-600 transition-all duration-300"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>

                {/* Reset Settings */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">Reset to Default</h3>
                      <p className="text-gray-400 text-sm">Reset all settings to their default values</p>
                    </div>
                    <button
                      onClick={resetSettings}
                      className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600"
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Application Info */}
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-lg flex items-center justify-center border border-gray-500/30">
                      <Info className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-300">Application Information</h2>
                      <p className="text-gray-400 text-sm">System details and version information</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Application Version</span>
                      <span className="text-cyan-400 font-medium">{appInfo.version}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Electron Version</span>
                      <span className="text-cyan-400 font-medium">{appInfo.electron}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Node.js Version</span>
                      <span className="text-cyan-400 font-medium">{appInfo.node}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Chrome Version</span>
                      <span className="text-cyan-400 font-medium">{appInfo.chrome}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Database Type</span>
                      <span className="text-cyan-400 font-medium">SQLite</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Database Version</span>
                      <span className="text-cyan-400 font-medium">3.40+</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Platform</span>
                      <span className="text-cyan-400 font-medium">Windows x64</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                      <span className="text-gray-400">Build Date</span>
                      <span className="text-cyan-400 font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="text-gray-300 font-medium mb-3">System Status</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Storage Usage</span>
                        <span>{appInfo.storageUsage.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${appInfo.storageUsage.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {appInfo.storageUsage.used} of {appInfo.storageUsage.total} used
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Settings */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Save Settings</h3>
                  <p className="text-gray-400 text-sm">
                    Apply all changes made to the settings
                  </p>
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 border border-cyan-500/30 flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save All Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <div className="flex items-center space-x-6">
                  <span>© {new Date().getFullYear()} <span className="text-amber-300">Cen</span>Drive Settings</span>
                  <span>•</span>
                  <span>Configuration Management</span>
                  <span>•</span>
                  <span>Version {appInfo.version}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure Settings</span>
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
              Settings: Ready to save
            </span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm">
            {saving ? 'Saving changes...' : 'Changes pending'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">
            Local Configuration • Auto-save: {databaseSettings.autoBackup ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Settings