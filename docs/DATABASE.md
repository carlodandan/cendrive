# CenDrive Database Documentation

## Overview

CenDrive relies on a local SQLite database to store all household and family member records. The database is heavily optimized for local desktop usage and offline-first capabilities.

### Connection & Configuration
- **Engine:** SQLite 3 (via the `rusqlite` Rust crate)
- **Journal Mode:** `WAL` (Write-Ahead Logging) for better concurrency and reliability.
- **Foreign Keys:** Enabled (`PRAGMA foreign_keys = ON`) to ensure cascading deletes work correctly.
- **Location:** The database file `cendrive.db` is stored in the application's roaming app data folder (resolved via Tauri's `app_data_dir`).

## Schema Design

The schema is normalized to separate household data from individual family members.

### `households` Table

Stores the primary contact and location data for a household head.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique household identifier |
| `first_name` | `TEXT` | `NOT NULL` | Household head's first name |
| `middle_name` | `TEXT` | | Optional middle name |
| `last_name` | `TEXT` | `NOT NULL` | Household head's last name |
| `extension` | `TEXT` | | Name extension (e.g., Jr., Sr.) |
| `house_no` | `TEXT` | | Physical house number |
| `street_name` | `TEXT` | | Street name |
| `barangay` | `TEXT` | | Philippine administrative division (Village/District) |
| `town` | `TEXT` | | Municipality or City |
| `province` | `TEXT` | | Philippine province |
| `region` | `TEXT` | | Philippine region |
| `zip_code` | `TEXT` | | Postal code |
| `contact_number` | `TEXT` | | Phone or mobile number |
| `email_address` | `TEXT` | | Email address |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Record last updated timestamp |

*Index:* `idx_households_name` on `(last_name, first_name)` for faster search lookups.

### `family_members` Table

Stores individual family members linked to a household.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique member identifier |
| `household_id` | `INTEGER` | `NOT NULL` | Foreign key to `households(id)` |
| `first_name` | `TEXT` | `NOT NULL` | Member's first name |
| `last_name` | `TEXT` | `NOT NULL` | Member's last name |
| `relationship` | `TEXT` | `NOT NULL` | Relationship to household head (e.g., father, mother, son) |
| `age` | `INTEGER` | | Member's age |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |

*Constraints:* `FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE`
*Index:* `idx_family_members_household` on `(household_id)` for faster join operations.

## Data Handling & Philippine Context

The database is structured to accommodate Philippine address formats. Specifically, the geographic locations rely on standard Philippine data hierarchies:
- **Region** -> **Province** -> **Town/City** -> **Barangay**

*Note: The frontend consumes Philippine geographic data to populate dropdowns, sourced from the `src/data` directory and processed via scripts in the `scripts/` directory.*

## Database Maintenance

- **WAL Checkpoint:** When the application window closes, Tauri intercepts the close event and executes `PRAGMA wal_checkpoint(TRUNCATE);` before closing the database handle. This guarantees data consistency and truncates the write-ahead log cleanly.
- **Compaction:** The app includes a user-facing maintenance function to run a `VACUUM` command, reclaiming disk space left by deleted records.
- **Backups:** Users can export the entire `.db` file securely through the Tauri file dialog. The backup process handles the WAL copy seamlessly.
