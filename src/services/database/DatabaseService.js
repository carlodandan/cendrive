const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs');

class DatabaseService {
  constructor() {
    const userDataPath = require('electron').app.getPath('userData');
    const dbPath = path.join(userDataPath, 'cendrive.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialized = false
  }

  // Initialize only when needed
  ensureInitialized() {
    if (this.initialized) return
    
    try {
      this.createTables()
      this.initialized = true
    } catch (error) {
      console.error('Database initialization error:', error)
      throw error
    }
  }

  createTables() {
    // Household table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS households (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        extension TEXT,
        house_no TEXT,
        street_name TEXT,
        barangay TEXT,
        town TEXT,
        province TEXT,
        region TEXT,
        zip_code TEXT,
        contact_number TEXT,
        email_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Family members table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        household_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
      )
    `)

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_households_name 
      ON households (last_name, first_name)
    `)
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_family_members_household 
      ON family_members (household_id)
    `)
  }

  // Household operations
  insertHousehold(household) {
    const stmt = this.db.prepare(`
      INSERT INTO households (
        first_name, middle_name, last_name, extension,
        house_no, street_name, barangay, town, province, region, zip_code,
        contact_number, email_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const info = stmt.run(
      household.firstName,
      household.middleName,
      household.lastName,
      household.extension,
      household.houseNo,
      household.streetName,
      household.barangay,
      household.town,
      household.province,
      household.region,
      household.zipCode,
      household.contactNumber,
      household.emailAddress
    )

    return info.lastInsertRowid
  }

  insertFamilyMembers(householdId, members) {
    const stmt = this.db.prepare(`
      INSERT INTO family_members (
        household_id, first_name, last_name, relationship, age
      ) VALUES (?, ?, ?, ?, ?)
    `)

    const insertMany = this.db.transaction((members) => {
      for (const member of members) {
        stmt.run(
          householdId,
          member.firstName,
          member.lastName,
          member.relationship,
          member.age || null
        )
      }
    })

    insertMany(members)
  }

  saveCensusRecord(record) {
    this.ensureInitialized()
    return this.db.transaction(() => {
      const householdId = this.insertHousehold(record)
      if (record.familyMembers && record.familyMembers.length > 0) {
        this.insertFamilyMembers(householdId, record.familyMembers)
      }
      return householdId
    })()
  }

  // Query operations
  getAllHouseholds() {
    this.ensureInitialized()
    const stmt = this.db.prepare(`
      SELECT h.*, 
             COUNT(fm.id) as family_count
      FROM households h
      LEFT JOIN family_members fm ON h.id = fm.household_id
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `)
    
    return stmt.all()
  }

  getHouseholdById(id) {
    const householdStmt = this.db.prepare(`
      SELECT * FROM households WHERE id = ?
    `)
    
    const membersStmt = this.db.prepare(`
      SELECT * FROM family_members 
      WHERE household_id = ? 
      ORDER BY 
        CASE relationship 
          WHEN 'father' THEN 1
          WHEN 'mother' THEN 2
          WHEN 'son' THEN 3
          WHEN 'daughter' THEN 4
          ELSE 5
        END,
        age DESC
    `)

    const household = householdStmt.get(id)
    if (household) {
      household.familyMembers = membersStmt.all(id)
    }
    
    return household
  }

  searchHouseholds(searchTerm) {
    const stmt = this.db.prepare(`
      SELECT h.*, 
            COUNT(fm.id) as family_count
      FROM households h
      LEFT JOIN family_members fm ON h.id = fm.household_id
      WHERE h.first_name LIKE ? 
        OR h.last_name LIKE ? 
        OR h.barangay LIKE ?
        OR h.town LIKE ? 
        OR h.province LIKE ?
      GROUP BY h.id
      ORDER BY h.last_name, h.first_name
    `)
    
    const searchPattern = `%${searchTerm}%`
    return stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
  }

  // Statistics
  getStatistics() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_households,
        SUM(CASE WHEN family_count > 0 THEN family_count ELSE 0 END) as total_family_members,
        AVG(family_count) as avg_family_size,
        MAX(family_count) as max_family_size
      FROM (
        SELECT h.id, COUNT(fm.id) as family_count
        FROM households h
        LEFT JOIN family_members fm ON h.id = fm.household_id
        GROUP BY h.id
      )
    `)
    
    return stmt.get()
  }

  // Delete operations
  deleteHousehold(id) {
    const stmt = this.db.prepare('DELETE FROM households WHERE id = ?')
    return stmt.run(id)
  }

  // Backup database
  backupDatabase(backupPath) {
    this.db.backup(backupPath)
      .then(() => {
        console.log('Database backup completed:', backupPath)
      })
      .catch((err) => {
        console.error('Database backup failed:', err)
      })
  }

  // Close database
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Create singleton instance and export it
const databaseService = new DatabaseService()

export default databaseService