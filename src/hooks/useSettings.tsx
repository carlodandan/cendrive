import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { attempt, resetSettings, saveSettings } from "../lib/api";
import {
  applyDensityPreference,
  applyMotionPreference,
  selectTheme,
  watchSystemTheme,
} from "../lib/theme";
import { useToast } from "../lib/toast";
import type { AppSettings } from "../lib/types";

interface SettingsApi {
  settings: AppSettings;
  saving: boolean;
  /** Merges a patch, applies its side effects, then persists it. */
  update: (patch: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

const SettingsContext = createContext<SettingsApi | null>(null);

/** Applies everything the document itself has to reflect. */
async function applyEffects(next: AppSettings, previous: AppSettings): Promise<void> {
  if (next.reduceMotion !== previous.reduceMotion) {
    applyMotionPreference(next.reduceMotion);
  }
  if (next.compactTables !== previous.compactTables) {
    applyDensityPreference(next.compactTables);
  }
  if (next.theme !== previous.theme) {
    await selectTheme(next.theme);
  }
}

/**
 * `initial` comes from the bootstrap in `main.tsx`, which has already read the
 * settings file to pick the theme — so the provider starts with real values and
 * no screen ever renders against defaults it then has to replace.
 */
export function SettingsProvider({
  initial,
  children,
}: {
  initial: AppSettings;
  children: ReactNode;
}) {
  const toast = useToast();
  const [settings, setSettings] = useState<AppSettings>(initial);
  const [saving, setSaving] = useState(false);

  // Read by the listener below, which is registered once and must not be torn
  // down and rebuilt every time the preference changes.
  const followingSystem = useRef(initial.theme === "system");
  useEffect(() => {
    followingSystem.current = settings.theme === "system";
  }, [settings.theme]);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;

    void watchSystemTheme(
      () => followingSystem.current,
      () => undefined,
    ).then((unlisten) => {
      if (active) stop = unlisten;
      else unlisten();
    });

    return () => {
      active = false;
      stop?.();
    };
  }, []);

  const persist = useCallback(
    async (next: AppSettings, previous: AppSettings) => {
      // Optimistic: the UI follows the click, and a failed write rolls back.
      setSettings(next);
      await applyEffects(next, previous);

      setSaving(true);
      const result = await attempt(() => saveSettings(next));
      setSaving(false);

      if (result.success) {
        // The backend clamps page size and theme, so trust what it returns.
        setSettings(result.data);
        await applyEffects(result.data, next);
      } else {
        setSettings(previous);
        await applyEffects(previous, next);
        toast.error("Could not save that setting.", result.error);
      }
    },
    [toast],
  );

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      await persist({ ...settings, ...patch }, settings);
    },
    [persist, settings],
  );

  const reset = useCallback(async () => {
    setSaving(true);
    const result = await attempt(resetSettings);
    setSaving(false);

    if (!result.success) {
      toast.error("Could not reset settings.", result.error);
      return;
    }

    const previous = settings;
    setSettings(result.data);
    await applyEffects(result.data, previous);
    toast.success("Settings restored to their defaults.");
  }, [settings, toast]);

  const api = useMemo<SettingsApi>(
    () => ({ settings, saving, update, reset }),
    [settings, saving, update, reset],
  );

  return <SettingsContext.Provider value={api}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside a SettingsProvider.");
  }
  return context;
}
