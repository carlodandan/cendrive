const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('databaseAPI', {

  // Save census record
  saveRecord: (record) => ipcRenderer.invoke('database:saveRecord', record),
  
  // Get all households
  getAllHouseholds: () => ipcRenderer.invoke('database:getAllHouseholds'),
  
  // Get household by ID
  getHouseholdById: (id) => ipcRenderer.invoke('database:getHouseholdById', id),
  
  // Search households
  searchHouseholds: (searchTerm) => ipcRenderer.invoke('database:searchHouseholds', searchTerm),
  
  // Get statistics
  getStatistics: () => ipcRenderer.invoke('database:getStatistics'),
  
  // Delete household
  deleteHousehold: (id) => ipcRenderer.invoke('database:deleteHousehold', id),
  
  // Backup database
  backupDatabase: (backupPath) => ipcRenderer.invoke('database:backup', backupPath),
  exportToExcel: () => ipcRenderer.invoke('database:exportToExcel'),
  
  // Events with proper cleanup
  onDatabaseInitialized: (callback) => {
    // Clean up any existing listeners first
    ipcRenderer.removeAllListeners('database:initialized')
    ipcRenderer.on('database:initialized', callback)
  },
  
  // Clean up event listener
  removeDatabaseInitializedListener: () => {
    ipcRenderer.removeAllListeners('database:initialized')
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,

  // Expose App
  getAppInfo: () => ipcRenderer.invoke('get-app-info')
})