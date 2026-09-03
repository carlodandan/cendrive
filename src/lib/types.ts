/**
 * Mirrors the `serde` output of `src-tauri/src/models.rs`. Any change on one
 * side has to land on the other; the Rust structs are the source of truth.
 */

export interface Household {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extension: string | null;
  houseNo: string | null;
  streetName: string | null;
  barangay: string | null;
  town: string | null;
  province: string | null;
  region: string | null;
  zipCode: string | null;
  contactNumber: string | null;
  emailAddress: string | null;
  createdAt: string;
  updatedAt: string;
  familyCount: number;
}

export interface FamilyMember {
  id: number;
  householdId: number;
  firstName: string;
  lastName: string;
  relationship: string;
  age: number | null;
  createdAt: string;
}

export interface HouseholdDetail extends Household {
  familyMembers: FamilyMember[];
}

export interface Statistics {
  totalHouseholds: number;
  totalFamilyMembers: number;
  avgFamilySize: number;
  maxFamilySize: number;
}

/** Write payload. Blank strings are stored as NULL by the backend. */
export interface HouseholdInput {
  firstName: string;
  middleName: string;
  lastName: string;
  extension: string;
  houseNo: string;
  streetName: string;
  barangay: string;
  town: string;
  province: string;
  region: string;
  zipCode: string;
  contactNumber: string;
  emailAddress: string;
}

export interface FamilyMemberInput {
  firstName: string;
  lastName: string;
  relationship: string;
  age: number | null;
}

export interface RecordInput {
  household: HouseholdInput;
  familyMembers: FamilyMemberInput[];
}

export type ThemeSource = "system" | "light" | "dark";

export interface ThemeState {
  source: ThemeSource;
  isDark: boolean;
}

export interface AppSettings {
  theme: ThemeSource;
  confirmDeletes: boolean;
  recordsPerPage: number;
  defaultRegion: string | null;
  backupFolder: string | null;
  compactTables: boolean;
  reduceMotion: boolean;
  sidebarCollapsed: boolean;
}

export interface AppInfo {
  app: {
    name: string;
    version: string;
    description: string;
    authors: string;
    repository: string;
    license: string;
  };
  runtime: {
    tauri: string;
    webview: string;
    rustc: string;
    osPlatform: string;
    osArch: string;
    buildProfile: string;
  };
  libs: {
    sqlite: string;
  };
}

export interface FileResult {
  path: string;
  bytes: number;
}

export interface MaintenanceResult {
  bytesBefore: number;
  bytesAfter: number;
  bytesFreed: number;
}

export interface DataLocations {
  database: string;
  folder: string;
  settings: string;
  bytes: number;
}

/**
 * The shape every hook hands back, kept from the Electron build so screens keep
 * branching on `success` instead of catching.
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
