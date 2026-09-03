use rusqlite::Row;
use serde::{Deserialize, Serialize};

/// A household row joined with its family member count.
/// Mirrors the `households` table one-to-one; `family_count` comes from the
/// `LEFT JOIN family_members` aggregate and is 0 when the column is absent.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Household {
    pub id: i64,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub extension: Option<String>,
    pub house_no: Option<String>,
    pub street_name: Option<String>,
    pub barangay: Option<String>,
    pub town: Option<String>,
    pub province: Option<String>,
    pub region: Option<String>,
    pub zip_code: Option<String>,
    pub contact_number: Option<String>,
    pub email_address: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub family_count: i64,
}

impl Household {
    pub fn from_row(row: &Row<'_>) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            first_name: row.get("first_name")?,
            middle_name: row.get("middle_name")?,
            last_name: row.get("last_name")?,
            extension: row.get("extension")?,
            house_no: row.get("house_no")?,
            street_name: row.get("street_name")?,
            barangay: row.get("barangay")?,
            town: row.get("town")?,
            province: row.get("province")?,
            region: row.get("region")?,
            zip_code: row.get("zip_code")?,
            contact_number: row.get("contact_number")?,
            email_address: row.get("email_address")?,
            created_at: row.get::<_, Option<String>>("created_at")?.unwrap_or_default(),
            updated_at: row.get::<_, Option<String>>("updated_at")?.unwrap_or_default(),
            family_count: row.get("family_count").unwrap_or(0),
        })
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FamilyMember {
    pub id: i64,
    pub household_id: i64,
    pub first_name: String,
    pub last_name: String,
    pub relationship: String,
    pub age: Option<i64>,
    pub created_at: String,
}

impl FamilyMember {
    pub fn from_row(row: &Row<'_>) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get("id")?,
            household_id: row.get("household_id")?,
            first_name: row.get("first_name")?,
            last_name: row.get("last_name")?,
            relationship: row.get("relationship")?,
            age: row.get("age")?,
            created_at: row.get::<_, Option<String>>("created_at")?.unwrap_or_default(),
        })
    }
}

/// `get_household_by_id` result: the household plus its members, ordered
/// father, mother, son, daughter, then everyone else by descending age.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HouseholdDetail {
    #[serde(flatten)]
    pub household: Household,
    pub family_members: Vec<FamilyMember>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Statistics {
    pub total_households: i64,
    pub total_family_members: i64,
    pub avg_family_size: f64,
    pub max_family_size: i64,
}

/// Payload for `save_record` / `update_household`. Field names match the
/// `formData` keys used by the Data Entry form.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct HouseholdInput {
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub extension: Option<String>,
    pub house_no: Option<String>,
    pub street_name: Option<String>,
    pub barangay: Option<String>,
    pub town: Option<String>,
    pub province: Option<String>,
    pub region: Option<String>,
    pub zip_code: Option<String>,
    pub contact_number: Option<String>,
    pub email_address: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct FamilyMemberInput {
    pub first_name: String,
    pub last_name: String,
    pub relationship: String,
    pub age: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RecordInput {
    pub household: HouseholdInput,
    pub family_members: Vec<FamilyMemberInput>,
}

/// `get_app_info` keeps the nesting the old Electron build used
/// (`app` / `runtime` / `libs`) so the About panel renders the same way.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub app: AppMeta,
    pub runtime: RuntimeInfo,
    pub libs: LibInfo,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMeta {
    pub name: String,
    pub version: String,
    pub description: String,
    pub authors: String,
    pub repository: String,
    pub license: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub tauri: String,
    pub webview: String,
    pub rustc: String,
    pub os_platform: String,
    pub os_arch: String,
    pub build_profile: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibInfo {
    /// Engine version reported by the bundled SQLite, the counterpart of the
    /// old build's `libs.betterSqlite3`.
    pub sqlite: String,
}

/// Mirrors Electron's `nativeTheme`: `source` is what the user picked,
/// `is_dark` is what the OS actually resolved it to.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeState {
    pub source: String,
    pub is_dark: bool,
}

/// Shown on the Settings screen so the user can see — and open — exactly where
/// their data lives.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataLocations {
    pub database: String,
    pub folder: String,
    pub settings: String,
    pub bytes: u64,
}


/// Result of `backup_database` and `export_to_excel`: where the file landed and
/// how large it is, so the UI can report something concrete instead of "done".
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileResult {
    pub path: String,
    pub bytes: u64,
}

/// Result of `clear_cache`: a WAL checkpoint plus VACUUM, reported honestly as
/// the number of bytes the database file actually shrank by.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MaintenanceResult {
    pub bytes_before: u64,
    pub bytes_after: u64,
    pub bytes_freed: u64,
}

