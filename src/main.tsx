import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";

import "@fontsource-variable/inter";
import "./index.css";

import { App } from "./App";
import { SettingsProvider } from "./hooks/useSettings";
import { attempt, getSettings } from "./lib/api";
import {
  applyDensityPreference,
  applyMotionPreference,
  loadTheme,
} from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import type { AppSettings } from "./lib/types";

/** Mirrors `AppSettings::default()` in Rust, for the case where the read fails. */
const FALLBACK: AppSettings = {
  theme: "system",
  confirmDeletes: true,
  recordsPerPage: 25,
  defaultRegion: null,
  backupFolder: null,
  compactTables: false,
  reduceMotion: false,
  sidebarCollapsed: false,
};

/**
 * Settings and theme are resolved before the first render, so no screen paints
 * against defaults it then has to replace. The window is created hidden and only
 * shown once the document reflects the stored theme, which removes the flash the
 * Electron build had on startup.
 */
async function bootstrap(): Promise<void> {
  const stored = await attempt(getSettings);
  const settings = stored.success ? stored.data : FALLBACK;

  applyMotionPreference(settings.reduceMotion);
  applyDensityPreference(settings.compactTables);
  await attempt(loadTheme);

  const container = document.getElementById("root");
  if (!container) throw new Error("The #root element is missing from index.html.");

  createRoot(container).render(
    <StrictMode>
      <ToastProvider>
        <SettingsProvider initial={settings}>
          <App />
        </SettingsProvider>
      </ToastProvider>
    </StrictMode>,
  );

  await getCurrentWindow().show();
}

void bootstrap().catch((error: unknown) => {
  console.error("Startup failed", error);
  // Never leave the user with an invisible window.
  void getCurrentWindow().show();
});
