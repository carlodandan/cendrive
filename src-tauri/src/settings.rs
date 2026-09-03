use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::AppResult;

/// Persisted preferences. Every field is consumed somewhere in the UI — the
/// Electron build kept these in component state, so they were lost on reload.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    /// "system" | "light" | "dark"
    pub theme: String,
    /// Ask before deleting a household.
    pub confirm_deletes: bool,
    /// Dashboard page size.
    pub records_per_page: u32,
    /// Pre-selected region on the Data Entry form, stored as the region slug.
    pub default_region: Option<String>,
    /// Folder used by one-click backups; falls back to the app data folder.
    pub backup_folder: Option<String>,
    /// Tighter table rows.
    pub compact_tables: bool,
    /// Force-disable animation regardless of the OS setting.
    pub reduce_motion: bool,
    /// Sidebar rail state.
    pub sidebar_collapsed: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            confirm_deletes: true,
            records_per_page: 25,
            default_region: None,
            backup_folder: None,
            compact_tables: false,
            reduce_motion: false,
            sidebar_collapsed: false,
        }
    }
}

impl AppSettings {
    /// Clamps values that the UI is not allowed to put out of range.
    fn normalized(mut self) -> Self {
        if !matches!(self.theme.as_str(), "system" | "light" | "dark") {
            self.theme = "system".to_string();
        }
        self.records_per_page = self.records_per_page.clamp(10, 200);
        self
    }
}

pub struct SettingsStore {
    path: PathBuf,
}

impl SettingsStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// A missing or unreadable file yields defaults rather than an error, so a
    /// corrupt settings file can never stop the app from starting.
    pub fn load(&self) -> AppSettings {
        match fs::read_to_string(&self.path) {
            Ok(raw) => match serde_json::from_str::<AppSettings>(&raw) {
                Ok(settings) => settings.normalized(),
                Err(err) => {
                    eprintln!("settings: ignoring unreadable {}: {err}", self.path.display());
                    AppSettings::default()
                }
            },
            Err(_) => AppSettings::default(),
        }
    }

    /// Writes to a temporary file first so an interrupted save cannot truncate
    /// the existing settings.
    pub fn save(&self, settings: &AppSettings) -> AppResult<AppSettings> {
        let settings = settings.clone().normalized();
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(&settings)?;
        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, json)?;
        fs::rename(&tmp, &self.path)?;
        Ok(settings)
    }

    pub fn reset(&self) -> AppResult<AppSettings> {
        self.save(&AppSettings::default())
    }
}
