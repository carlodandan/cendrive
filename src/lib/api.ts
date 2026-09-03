import { invoke } from "@tauri-apps/api/core";

import type {
  ApiResult,
  AppInfo,
  AppSettings,
  DataLocations,
  FileResult,
  Household,
  HouseholdDetail,
  MaintenanceResult,
  RecordInput,
  Statistics,
  ThemeSource,
  ThemeState,
} from "./types";

/**
 * One typed wrapper per Rust command. A rejected `invoke` carries the string
 * produced by `AppError`, which `attempt()` folds back into an `ApiResult`.
 */

export const saveRecord = (record: RecordInput): Promise<number> =>
  invoke("save_record", { record });

export const updateHousehold = (id: number, record: RecordInput): Promise<void> =>
  invoke("update_household", { id, record });

export const deleteHousehold = (id: number): Promise<void> =>
  invoke("delete_household", { id });

export const getAllHouseholds = (): Promise<Household[]> =>
  invoke("get_all_households");

export const getHouseholdById = (id: number): Promise<HouseholdDetail> =>
  invoke("get_household_by_id", { id });

export const searchHouseholds = (term: string): Promise<Household[]> =>
  invoke("search_households", { term });

export const getStatistics = (): Promise<Statistics> => invoke("get_statistics");

export const backupDatabase = (path?: string | null): Promise<FileResult> =>
  invoke("backup_database", { path: path ?? null });

export const exportToExcel = (path: string): Promise<FileResult> =>
  invoke("export_to_excel", { path });

export const exportReportCsv = (path: string, contents: string): Promise<FileResult> =>
  invoke("export_report_csv", { path, contents });

export const getSettings = (): Promise<AppSettings> => invoke("get_settings");

export const saveSettings = (values: AppSettings): Promise<AppSettings> =>
  invoke("save_settings", { values });

export const resetSettings = (): Promise<AppSettings> => invoke("reset_settings");

export const setTheme = (source: ThemeSource): Promise<ThemeState> =>
  invoke("set_theme", { source });

export const getTheme = (): Promise<ThemeState> => invoke("get_theme");

export const getAppInfo = (): Promise<AppInfo> => invoke("get_app_info");

export const clearCache = (): Promise<MaintenanceResult> => invoke("clear_cache");

export const getDataLocations = (): Promise<DataLocations> =>
  invoke("get_data_locations");

/** Commands reject with a plain string; anything else is unexpected. */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function attempt<T>(
  operation: () => Promise<T>,
): Promise<ApiResult<T>> {
  try {
    return { success: true, data: await operation() };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
