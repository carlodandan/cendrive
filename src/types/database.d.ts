interface Household {
  id?: number
  firstName: string
  middleName?: string
  lastName: string
  extension?: string
  houseNo?: string
  streetName?: string
  barangay?: string
  town?: string
  province?: string
  region?: string
  zipCode?: string
  contactNumber?: string
  emailAddress?: string
  familyMembers?: FamilyMember[]
  created_at?: string
  updated_at?: string
}

interface FamilyMember {
  id?: number
  householdId?: number
  firstName: string
  lastName: string
  relationship: 'father' | 'mother' | 'son' | 'daughter' | 'sibling' | 'grandfather' | 'grandmother' | 'uncle' | 'aunt' | 'cousin' | 'other'
  age?: number
  created_at?: string
}

interface DatabaseAPI {
  initialize: () => Promise<{ success: boolean; error?: string }>
  saveRecord: (record: Household) => Promise<{ success: boolean; householdId?: number; error?: string }>
  getAllHouseholds: () => Promise<{ success: boolean; data?: Household[]; error?: string }>
  getHouseholdById: (id: number) => Promise<{ success: boolean; data?: Household; error?: string }>
  searchHouseholds: (searchTerm: string) => Promise<{ success: boolean; data?: Household[]; error?: string }>
  getStatistics: () => Promise<{ success: boolean; data?: any; error?: string }>
  deleteHousehold: (id: number) => Promise<{ success: boolean; affectedRows?: number; error?: string }>
  backupDatabase: (backupPath: string) => Promise<{ success: boolean; error?: string }>
  onDatabaseInitialized: (callback: () => void) => void
}

declare global {
  interface Window {
    databaseAPI: DatabaseAPI
    electronAPI: {
      platform: string
      version: string
    }
  }
}