use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, State, Window};

use crate::db::{self, Db};
use crate::error::{AppError, AppResult};
use crate::excel;
use crate::models::{
    AppInfo, AppMeta, DataLocations, FileResult, Household, HouseholdDetail, LibInfo,
    MaintenanceResult, RecordInput, RuntimeInfo, Statistics, ThemeState,
};
use crate::settings::{AppSettings, SettingsStore};

// Commands are `async` so Tauri runs them on the async runtime instead of the
// main thread: a large export or a VACUUM must not freeze the window.

#[tauri::command]
pub async fn save_record(state: State<'_, Db>, record: RecordInput) -> AppResult<i64> {
    state.with_mut(|conn| db::insert_record(conn, &record))
}

#[tauri::command]
pub async fn update_household(
    state: State<'_, Db>,
    id: i64,
    record: RecordInput,
) -> AppResult<()> {
    state.with_mut(|conn| db::update_record(conn, id, &record))
}

#[tauri::command]
pub async fn delete_household(state: State<'_, Db>, id: i64) -> AppResult<()> {
    state.with(|conn| db::delete_household(conn, id))
}

#[tauri::command]
pub async fn get_all_households(state: State<'_, Db>) -> AppResult<Vec<Household>> {
    state.with(db::all_households)
}

#[tauri::command]
pub async fn get_household_by_id(state: State<'_, Db>, id: i64) -> AppResult<HouseholdDetail> {
    state.with(|conn| db::household_by_id(conn, id))
}

#[tauri::command]
pub async fn search_households(
    state: State<'_, Db>,
    term: String,
) -> AppResult<Vec<Household>> {
    state.with(|conn| db::search_households(conn, &term))
}

#[tauri::command]
pub async fn get_statistics(state: State<'_, Db>) -> AppResult<Statistics> {
    state.with(db::statistics)
}

fn parent_dir(path: &std::path::Path) -> Option<&std::path::Path> {
    path.parent().filter(|p| !p.as_os_str().is_empty())
}

fn file_result(path: PathBuf) -> AppResult<FileResult> {
    let bytes = fs::metadata(&path)?.len();
    Ok(FileResult {
        path: path.to_string_lossy().into_owned(),
        bytes,
    })
}

fn with_extension(path: PathBuf, extension: &str) -> PathBuf {
    if path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case(extension))
    {
        path
    } else {
        path.with_extension(extension)
    }
}

fn default_backup_folder(db_path: &std::path::Path) -> PathBuf {
    db_path
        .parent()
        .map(|parent| parent.join("backups"))
        .unwrap_or_else(|| PathBuf::from("backups"))
}

/// Runs `sqlite3_backup` to completion and reports where the file actually
/// landed. `path` comes from the save dialog; without one the copy goes to the
/// configured backup folder.
#[tauri::command]
pub async fn backup_database(
    state: State<'_, Db>,
    settings: State<'_, SettingsStore>,
    path: Option<String>,
) -> AppResult<FileResult> {
    let configured = settings.load().backup_folder;

    let target = state.with(|conn| {
        let target = match path.as_deref().map(str::trim) {
            Some(chosen) if !chosen.is_empty() => with_extension(PathBuf::from(chosen), "db"),
            _ => {
                let folder = configured
                    .filter(|folder| !folder.trim().is_empty())
                    .map(PathBuf::from)
                    .unwrap_or_else(|| default_backup_folder(state.path()));
                folder.join(format!("cendrive-backup-{}.db", db::file_stamp(conn)?))
            }
        };
        if let Some(parent) = parent_dir(&target) {
            fs::create_dir_all(parent)?;
        }
        // 0.40 replaced `DatabaseName` with `&CStr` names.
        conn.backup(rusqlite::MAIN_DB, &target, None)?;
        Ok(target)
    })?;

    file_result(target)
}

#[tauri::command]
pub async fn export_to_excel(state: State<'_, Db>, path: String) -> AppResult<FileResult> {
    let (households, members) = state.with(|conn| {
        Ok((db::all_households(conn)?, db::all_family_members(conn)?))
    })?;

    if households.is_empty() {
        return Err(AppError::other("There are no records to export yet."));
    }

    let target = with_extension(PathBuf::from(path), "xlsx");
    excel::write_workbook(&target, &households, &members)?;
    file_result(target)
}

/// The Reports screen already has the aggregated view model, so it composes the
/// CSV and this command only writes it — with a BOM so Excel reads UTF-8.
#[tauri::command]
pub async fn export_report_csv(path: String, contents: String) -> AppResult<FileResult> {
    let target = with_extension(PathBuf::from(path), "csv");
    if let Some(parent) = parent_dir(&target) {
        fs::create_dir_all(parent)?;
    }

    let mut bytes = Vec::with_capacity(contents.len() + 3);
    bytes.extend_from_slice(&[0xEF, 0xBB, 0xBF]);
    bytes.extend_from_slice(contents.as_bytes());
    fs::write(&target, bytes)?;

    file_result(target)
}

#[tauri::command]
pub async fn get_settings(settings: State<'_, SettingsStore>) -> AppResult<AppSettings> {
    Ok(settings.load())
}

#[tauri::command]
pub async fn save_settings(
    settings: State<'_, SettingsStore>,
    values: AppSettings,
) -> AppResult<AppSettings> {
    settings.save(&values)
}

#[tauri::command]
pub async fn reset_settings(settings: State<'_, SettingsStore>) -> AppResult<AppSettings> {
    settings.reset()
}

fn is_dark(window: &Window) -> bool {
    matches!(window.theme(), Ok(tauri::Theme::Dark))
}

/// The counterpart of `nativeTheme.themeSource`: "system" hands control back to
/// the OS, and the resolved value comes back so the UI can match it.
#[tauri::command]
pub async fn set_theme(window: Window, source: String) -> AppResult<ThemeState> {
    let theme = match source.as_str() {
        "light" => Some(tauri::Theme::Light),
        "dark" => Some(tauri::Theme::Dark),
        "system" => None,
        other => return Err(AppError::other(format!("Unknown theme '{other}'."))),
    };
    window.set_theme(theme)?;
    Ok(ThemeState {
        is_dark: is_dark(&window),
        source,
    })
}

#[tauri::command]
pub async fn get_theme(
    window: Window,
    settings: State<'_, SettingsStore>,
) -> AppResult<ThemeState> {
    Ok(ThemeState {
        source: settings.load().theme,
        is_dark: is_dark(&window),
    })
}

#[tauri::command]
pub async fn get_app_info(app: AppHandle) -> AppResult<AppInfo> {
    let package = app.package_info();
    Ok(AppInfo {
        app: AppMeta {
            name: package.name.clone(),
            version: package.version.to_string(),
            description: package.description.to_string(),
            authors: package.authors.replace(':', ", "),
            repository: env!("CARGO_PKG_REPOSITORY").to_string(),
            license: env!("CARGO_PKG_LICENSE").to_string(),
        },
        runtime: RuntimeInfo {
            tauri: tauri::VERSION.to_string(),
            webview: tauri::webview_version().unwrap_or_else(|_| "unknown".to_string()),
            rustc: env!("BUILD_RUSTC").to_string(),
            os_platform: std::env::consts::OS.to_string(),
            os_arch: std::env::consts::ARCH.to_string(),
            build_profile: env!("BUILD_PROFILE").to_string(),
        },
        libs: LibInfo {
            sqlite: rusqlite::version().to_string(),
        },
    })
}

/// Checkpoints the WAL, rebuilds the file with VACUUM and refreshes the query
/// planner statistics, then reports how much the file actually shrank.
#[tauri::command]
pub async fn clear_cache(state: State<'_, Db>) -> AppResult<MaintenanceResult> {
    let bytes_before = fs::metadata(state.path()).map(|meta| meta.len()).unwrap_or(0);

    state.with(|conn| {
        conn.query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |_| Ok(()))?;
        conn.execute_batch("VACUUM;")?;
        let _ = conn.execute_batch("PRAGMA optimize;");
        Ok(())
    })?;

    let bytes_after = fs::metadata(state.path())
        .map(|meta| meta.len())
        .unwrap_or(bytes_before);

    Ok(MaintenanceResult {
        bytes_before,
        bytes_after,
        bytes_freed: bytes_before.saturating_sub(bytes_after),
    })
}

#[tauri::command]
pub async fn get_data_locations(
    state: State<'_, Db>,
    settings: State<'_, SettingsStore>,
) -> AppResult<DataLocations> {
    let database = state.path().to_path_buf();
    let folder = database
        .parent()
        .map(|parent| parent.to_path_buf())
        .unwrap_or_else(|| database.clone());
    let bytes = fs::metadata(&database).map(|meta| meta.len()).unwrap_or(0);

    Ok(DataLocations {
        database: database.to_string_lossy().into_owned(),
        folder: folder.to_string_lossy().into_owned(),
        settings: settings.path().to_string_lossy().into_owned(),
        bytes,
    })
}

