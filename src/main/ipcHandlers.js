import databaseService from '../services/database/DatabaseService';

function setupIpcHandlers(ipcMain) {
  // Save census record
  ipcMain.handle('database:saveRecord', (event, record) => {
    try {
      const householdId = databaseService.saveCensusRecord(record)
      return { success: true, householdId }
    } catch (error) {
      console.error('Error saving record:', error)
      return { success: false, error: error.message }
    }
  })

  // Get all households
  ipcMain.handle('database:getAllHouseholds', () => {
    try {
      const households = databaseService.getAllHouseholds()
      return { success: true, data: households }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Get household by ID
  ipcMain.handle('database:getHouseholdById', (event, id) => {
    try {
      const household = databaseService.getHouseholdById(id)
      return { success: true, data: household }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Search households
  ipcMain.handle('database:searchHouseholds', (event, searchTerm) => {
    try {
      const results = databaseService.searchHouseholds(searchTerm)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Get statistics
  ipcMain.handle('database:getStatistics', () => {
    try {
      const stats = databaseService.getStatistics()
      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Delete household
  ipcMain.handle('database:deleteHousehold', (event, id) => {
    try {
      const result = databaseService.deleteHousehold(id)
      return { success: true, affectedRows: result.changes }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Backup database
  ipcMain.handle('database:backup', (event, backupPath) => {
    try {
      databaseService.backupDatabase(backupPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

export default setupIpcHandlers