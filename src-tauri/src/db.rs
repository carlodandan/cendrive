use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{AppError, AppResult};
use crate::models::{
    FamilyMember, FamilyMemberInput, Household, HouseholdDetail, RecordInput, Statistics,
};

/// Schema is identical to the Electron build's `DatabaseService`, so an existing
/// `cendrive.db` opens unchanged.
const SCHEMA: &str = r#"
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
);

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  age INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_households_name ON households (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_family_members_household ON family_members (household_id);
"#;

/// Columns shared by the list and search queries.
const HOUSEHOLD_LIST_SELECT: &str = "SELECT h.*, COUNT(fm.id) AS family_count \
     FROM households h LEFT JOIN family_members fm ON h.id = fm.household_id";

/// Lazily-opened SQLite handle. The connection is created on first use and the
/// schema is applied at that moment, so every command — read or write — is safe
/// to call on a fresh install regardless of which screen loads first.
pub struct Db {
    conn: Mutex<Option<Connection>>,
    path: PathBuf,
}

impl Db {
    pub fn new(path: PathBuf) -> Self {
        Self {
            conn: Mutex::new(None),
            path,
        }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    fn open(path: &Path) -> AppResult<Connection> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(path)?;
        conn.busy_timeout(Duration::from_secs(5))?;
        // journal_mode returns a row, so it cannot go through execute_batch.
        let _: String = conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        conn.execute_batch(SCHEMA)?;
        Ok(conn)
    }

    fn locked(&self) -> AppResult<std::sync::MutexGuard<'_, Option<Connection>>> {
        self.conn
            .lock()
            .map_err(|_| AppError::other("Database lock was poisoned by an earlier failure."))
    }

    pub fn with<T>(&self, f: impl FnOnce(&Connection) -> AppResult<T>) -> AppResult<T> {
        let mut guard = self.locked()?;
        if guard.is_none() {
            *guard = Some(Self::open(&self.path)?);
        }
        f(guard.as_ref().expect("connection initialized above"))
    }

    pub fn with_mut<T>(&self, f: impl FnOnce(&mut Connection) -> AppResult<T>) -> AppResult<T> {
        let mut guard = self.locked()?;
        if guard.is_none() {
            *guard = Some(Self::open(&self.path)?);
        }
        f(guard.as_mut().expect("connection initialized above"))
    }

    /// Checkpoints the WAL and releases the handle. Called on window close so
    /// the database file on disk is complete before the process exits.
    pub fn close(&self) {
        if let Ok(mut guard) = self.conn.lock() {
            if let Some(conn) = guard.take() {
                let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
                let _ = conn.close();
            }
        }
    }
}

/// Trims a value and treats blank input as "not provided" so the database holds
/// NULL rather than a mix of NULLs and empty strings.
fn nz(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_owned)
}

fn required(value: &str, label: &str) -> AppResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(AppError::other(format!("{label} is required.")));
    }
    Ok(trimmed.to_owned())
}

fn insert_members(
    tx: &rusqlite::Transaction<'_>,
    household_id: i64,
    members: &[FamilyMemberInput],
) -> AppResult<()> {
    let mut stmt = tx.prepare(
        "INSERT INTO family_members (household_id, first_name, last_name, relationship, age)
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )?;
    for member in members {
        let first = member.first_name.trim();
        let last = member.last_name.trim();
        if first.is_empty() && last.is_empty() {
            continue; // skip rows the user added but never filled in
        }
        stmt.execute(params![
            household_id,
            required(&member.first_name, "Family member first name")?,
            required(&member.last_name, "Family member last name")?,
            required(&member.relationship, "Family member relationship")?,
            member.age,
        ])?;
    }
    Ok(())
}

pub fn insert_record(conn: &mut Connection, input: &RecordInput) -> AppResult<i64> {
    let h = &input.household;
    let first_name = required(&h.first_name, "First name")?;
    let last_name = required(&h.last_name, "Last name")?;

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO households (first_name, middle_name, last_name, extension, house_no,
             street_name, barangay, town, province, region, zip_code, contact_number, email_address)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            first_name,
            nz(&h.middle_name),
            last_name,
            nz(&h.extension),
            nz(&h.house_no),
            nz(&h.street_name),
            nz(&h.barangay),
            nz(&h.town),
            nz(&h.province),
            nz(&h.region),
            nz(&h.zip_code),
            nz(&h.contact_number),
            nz(&h.email_address),
        ],
    )?;
    let id = tx.last_insert_rowid();
    insert_members(&tx, id, &input.family_members)?;
    tx.commit()?;
    Ok(id)
}

/// Updates the household and replaces its member list in one transaction.
/// Members are re-inserted rather than diffed, so their row ids are not stable
/// across edits — nothing in the UI depends on them.
pub fn update_record(conn: &mut Connection, id: i64, input: &RecordInput) -> AppResult<()> {
    let h = &input.household;
    let first_name = required(&h.first_name, "First name")?;
    let last_name = required(&h.last_name, "Last name")?;

    let tx = conn.transaction()?;
    let changed = tx.execute(
        "UPDATE households SET first_name = ?1, middle_name = ?2, last_name = ?3, extension = ?4,
             house_no = ?5, street_name = ?6, barangay = ?7, town = ?8, province = ?9, region = ?10,
             zip_code = ?11, contact_number = ?12, email_address = ?13,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?14",
        params![
            first_name,
            nz(&h.middle_name),
            last_name,
            nz(&h.extension),
            nz(&h.house_no),
            nz(&h.street_name),
            nz(&h.barangay),
            nz(&h.town),
            nz(&h.province),
            nz(&h.region),
            nz(&h.zip_code),
            nz(&h.contact_number),
            nz(&h.email_address),
            id,
        ],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound(id));
    }
    tx.execute("DELETE FROM family_members WHERE household_id = ?1", params![id])?;
    insert_members(&tx, id, &input.family_members)?;
    tx.commit()?;
    Ok(())
}

pub fn all_households(conn: &Connection) -> AppResult<Vec<Household>> {
    let sql = format!("{HOUSEHOLD_LIST_SELECT} GROUP BY h.id ORDER BY h.created_at DESC");
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], Household::from_row)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// Blank search terms fall back to the full list instead of returning nothing.
pub fn search_households(conn: &Connection, term: &str) -> AppResult<Vec<Household>> {
    let term = term.trim();
    if term.is_empty() {
        return all_households(conn);
    }
    let sql = format!(
        "{HOUSEHOLD_LIST_SELECT} \
         WHERE h.first_name LIKE ?1 OR h.last_name LIKE ?1 OR h.barangay LIKE ?1 \
            OR h.town LIKE ?1 OR h.province LIKE ?1 \
         GROUP BY h.id ORDER BY h.last_name, h.first_name"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params![format!("%{term}%")], Household::from_row)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

pub fn household_by_id(conn: &Connection, id: i64) -> AppResult<HouseholdDetail> {
    let mut household = conn
        .query_row(
            "SELECT h.* FROM households h WHERE h.id = ?1",
            params![id],
            Household::from_row,
        )
        .optional()?
        .ok_or(AppError::NotFound(id))?;

    let mut stmt = conn.prepare(
        "SELECT * FROM family_members WHERE household_id = ?1
         ORDER BY CASE relationship
             WHEN 'father' THEN 1
             WHEN 'mother' THEN 2
             WHEN 'son' THEN 3
             WHEN 'daughter' THEN 4
             ELSE 5
           END, age DESC",
    )?;
    let family_members = stmt
        .query_map(params![id], FamilyMember::from_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    household.family_count = family_members.len() as i64;
    Ok(HouseholdDetail {
        household,
        family_members,
    })
}

pub fn statistics(conn: &Connection) -> AppResult<Statistics> {
    const SQL: &str = "WITH sizes AS (
         SELECT COUNT(fm.id) AS size FROM households h
         LEFT JOIN family_members fm ON h.id = fm.household_id
         GROUP BY h.id)
       SELECT
         (SELECT COUNT(*) FROM households) AS total_households,
         (SELECT COUNT(*) FROM family_members) AS total_family_members,
         COALESCE((SELECT AVG(size) FROM sizes), 0) AS avg_family_size,
         COALESCE((SELECT MAX(size) FROM sizes), 0) AS max_family_size";

    Ok(conn.query_row(SQL, [], |row| {
        Ok(Statistics {
            total_households: row.get("total_households")?,
            total_family_members: row.get("total_family_members")?,
            avg_family_size: row.get("avg_family_size")?,
            max_family_size: row.get("max_family_size")?,
        })
    })?)
}

/// `ON DELETE CASCADE` plus `foreign_keys = ON` removes the members with it.
pub fn delete_household(conn: &Connection, id: i64) -> AppResult<()> {
    let changed = conn.execute("DELETE FROM households WHERE id = ?1", params![id])?;
    if changed == 0 {
        return Err(AppError::NotFound(id));
    }
    Ok(())
}

pub fn all_family_members(conn: &Connection) -> AppResult<Vec<FamilyMember>> {
    let mut stmt =
        conn.prepare("SELECT * FROM family_members ORDER BY household_id, id")?;
    let rows = stmt.query_map([], FamilyMember::from_row)?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// `20260904-142530`, from SQLite so no date crate is needed.
pub fn file_stamp(conn: &Connection) -> AppResult<String> {
    Ok(conn.query_row(
        "SELECT strftime('%Y%m%d-%H%M%S', 'now', 'localtime')",
        [],
        |row| row.get(0),
    )?)
}
