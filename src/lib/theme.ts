import { getCurrentWindow } from "@tauri-apps/api/window";

import { getTheme, setTheme } from "./api";
import type { ThemeSource, ThemeState } from "./types";

/**
 * The webview class and the native window theme are kept in step: Rust owns the
 * window (title bar, native scrollbar, form controls via `color-scheme`) and the
 * `.dark` class owns the Tailwind tokens.
 */
export function applyThemeClass(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
}

export async function selectTheme(source: ThemeSource): Promise<ThemeState> {
  const state = await setTheme(source);
  applyThemeClass(state.isDark);
  return state;
}

export async function loadTheme(): Promise<ThemeState> {
  const state = await getTheme();
  applyThemeClass(state.isDark);
  return state;
}

/**
 * Follows the OS while the preference is "system". Returns an unsubscribe
 * function; the listener is registered once at app start.
 */
export async function watchSystemTheme(
  isFollowingSystem: () => boolean,
  onChange: (isDark: boolean) => void,
): Promise<() => void> {
  return getCurrentWindow().onThemeChanged(({ payload }) => {
    if (!isFollowingSystem()) return;
    const isDark = payload === "dark";
    applyThemeClass(isDark);
    onChange(isDark);
  });
}

/** Settings can force reduced motion independently of the OS setting. */
export function applyMotionPreference(reduceMotion: boolean): void {
  document.documentElement.classList.toggle("no-motion", reduceMotion);
}

/** Compact table rows. */
export function applyDensityPreference(compact: boolean): void {
  document.documentElement.classList.toggle("dense", compact);
}
