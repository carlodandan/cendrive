mod commands;
mod db;
mod error;
mod excel;
mod models;
mod settings;

use std::fs;
use std::path::Path;
use std::time::Duration;

use tauri::{Manager, WindowEvent};

use db::Db;
use settings::SettingsStore;

/// Electron kept the database in `app.getPath('userData')`, which is keyed by
/// application name; Tauri's app data folder is keyed by bundle identifier. On
/// first run we copy a database left behind by the old build — including any
/// un-checkpointed WAL — instead of silently starting empty.
fn migrate_legacy_database(app: &tauri::AppHandle, target: &Path) {
    if target.exists() {
        return;
    }
    let Ok(roaming) = app.path().data_dir() else {
        return;
    };

    for folder in ["CenDrive", "cendrive"] {
        let legacy = roaming.join(folder).join("cendrive.db");
        if !legacy.exists() {
            continue;
        }
        if let Some(parent) = target.parent() {
            if let Err(err) = fs::create_dir_all(parent) {
                eprintln!("migration: cannot create {}: {err}", parent.display());
                return;
            }
        }
        match fs::copy(&legacy, target) {
            Ok(_) => {
                for suffix in ["-wal", "-shm"] {
                    let from = with_suffix(&legacy, suffix);
                    if from.exists() {
                        let _ = fs::copy(&from, with_suffix(target, suffix));
                    }
                }
                eprintln!("migration: copied database from {}", legacy.display());
            }
            Err(err) => eprintln!("migration: cannot copy {}: {err}", legacy.display()),
        }
        return;
    }
}

fn with_suffix(path: &Path, suffix: &str) -> std::path::PathBuf {
    let mut name = path.as_os_str().to_os_string();
    name.push(suffix);
    name.into()
}

fn theme_from(source: &str) -> Option<tauri::Theme> {
    match source {
        "light" => Some(tauri::Theme::Light),
        "dark" => Some(tauri::Theme::Dark),
        _ => None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // The updater downloads the installer and runs it; process supplies
            // the relaunch afterwards. Both are desktop-only, which is what the
            // target gate in Cargo.toml says as well.
            #[cfg(desktop)]
            {
                handle.plugin(tauri_plugin_updater::Builder::new().build())?;
                handle.plugin(tauri_plugin_process::init())?;
            }

            let db_path = handle.path().app_data_dir()?.join("cendrive.db");
            migrate_legacy_database(&handle, &db_path);
            app.manage(Db::new(db_path));

            let settings_path = handle.path().app_config_dir()?.join("settings.json");
            app.manage(SettingsStore::new(settings_path));

            if let Some(window) = handle.get_webview_window("main") {
                // Match the stored preference before the window is revealed so
                // the native frame and the webview agree from the first frame.
                let stored = app.state::<SettingsStore>().load();
                let _ = window.set_theme(theme_from(&stored.theme));

                // The frontend calls show() once it has painted; this is the
                // safety net for the case where it never gets that far.
                let fallback = window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_secs(3));
                    if matches!(fallback.is_visible(), Ok(false)) {
                        let _ = fallback.show();
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Replaces Electron's `before-quit` handler: checkpoint the WAL and
            // release the file while the app is still alive.
            if matches!(event, WindowEvent::Destroyed) {
                window.state::<Db>().close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_record,
            commands::update_household,
            commands::delete_household,
            commands::get_all_households,
            commands::get_household_by_id,
            commands::search_households,
            commands::get_statistics,
            commands::backup_database,
            commands::export_to_excel,
            commands::export_report_csv,
            commands::get_settings,
            commands::save_settings,
            commands::reset_settings,
            commands::set_theme,
            commands::get_theme,
            commands::get_app_info,
            commands::clear_cache,
            commands::get_data_locations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CenDrive");
}
