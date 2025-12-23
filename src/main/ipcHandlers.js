import databaseService from '../services/database/DatabaseService';
import { app, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

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

  // Enhanced IPC handler for full database export
  ipcMain.handle('database:exportToExcel', async () => {
    try {
      const households = databaseService.getAllHouseholds()
      
      // Prepare household data for Excel
      const householdData = households.map(household => ({
        'Household ID': household.id,
        'First Name': household.first_name || '',
        'Middle Name': household.middle_name || '',
        'Last Name': household.last_name || '',
        'Extension': household.extension || '',
        'House No': household.house_no || '',
        'Street': household.street_name || '',
        'Barangay': household.barangay || '',
        'Town': household.town || '',
        'Province': household.province || '',
        'Region': household.region || '',
        'ZIP Code': household.zip_code || '',
        'Contact Number': household.contact_number || '',
        'Email Address': household.email_address || '',
        'Family Members Count': household.family_count || 0,
        'Created At': household.created_at || '',
        'Updated At': household.updated_at || ''
      }))
      
      // Prepare family members data
      const familyMembersData = []
      let totalFamilyMembers = 0
      
      for (const household of households) {
        const householdDetails = databaseService.getHouseholdById(household.id)
        if (householdDetails && householdDetails.familyMembers) {
          householdDetails.familyMembers.forEach(member => {
            familyMembersData.push({
              'Member ID': member.id,
              'Household ID': household.id,
              'First Name': member.first_name || '',
              'Last Name': member.last_name || '',
              'Relationship': member.relationship || '',
              'Age': member.age || '',
              'Created At': member.created_at || ''
            })
            totalFamilyMembers++
          })
        }
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new()
      
      // Create household sheet
      const householdSheet = XLSX.utils.json_to_sheet(householdData)
      XLSX.utils.book_append_sheet(workbook, householdSheet, 'Households')
      
      // Create family members sheet
      const familySheet = XLSX.utils.json_to_sheet(familyMembersData)
      XLSX.utils.book_append_sheet(workbook, familySheet, 'Family Members')
      
      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return { 
        success: true, 
        excelBuffer,
        stats: {
          totalHouseholds: households.length,
          totalFamilyMembers
        }
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-app-info', () => {
    const packageJsonPath = path.join(app.getAppPath(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return {
      app: app.getVersion(),
      runtime: {
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome,
        os_platform: process.platform,
        os_arch: process.arch
      },
      libs: {
        betterSqlite3: packageJson.dependencies?.['better-sqlite3'] ?? 'unknown',
      },
    };
  });

  ipcMain.handle('theme:set', (_event, theme) => {
    nativeTheme.themeSource = theme // 'dark' | 'light' | 'system'
    return nativeTheme.shouldUseDarkColors
  })

  ipcMain.handle('theme:get', () => {
    return nativeTheme.themeSource
  })
}

export default setupIpcHandlers