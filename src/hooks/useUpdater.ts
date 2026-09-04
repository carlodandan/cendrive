import { useCallback, useEffect, useRef, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";

import { errorMessage } from "../lib/api";
import { checkForUpdate, installUpdate } from "../lib/updater";

export type UpdateStage =
  | "checking"
  | "current"
  | "available"
  | "downloading"
  | "failed";

export interface UpdaterState {
  stage: UpdateStage;
  version: string | null;
  notes: string | null;
  /** 0–1 once a size is known, null when the release advertises none. */
  percent: number | null;
  error: string | null;
}

export interface Updater {
  state: UpdaterState;
  /** Both resolve with the state they settled on, so callers can announce it. */
  check: (force?: boolean) => Promise<UpdaterState>;
  install: () => Promise<UpdaterState>;
}

const CHECKING: UpdaterState = {
  stage: "checking",
  version: null,
  notes: null,
  percent: null,
  error: null,
};

/** Release notes are Markdown from the tag; blank is common and means nothing. */
function notesOf(update: Update): string | null {
  return update.body?.trim() || null;
}

/**
 * The check runs once on mount, which is free after the startup check has
 * already resolved it. `force` is for the button: it goes back to the endpoint.
 */
export function useUpdater(): Updater {
  const [state, setState] = useState<UpdaterState>(CHECKING);
  const found = useRef<Update | null>(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const settle = useCallback((next: UpdaterState) => {
    if (live.current) setState(next);
    return next;
  }, []);

  const check = useCallback(
    async (force = false): Promise<UpdaterState> => {
      settle(CHECKING);
      try {
        const update = await checkForUpdate(force);
        found.current = update;
        return settle(
          update
            ? {
                stage: "available",
                version: update.version,
                notes: notesOf(update),
                percent: null,
                error: null,
              }
            : { ...CHECKING, stage: "current" },
        );
      } catch (error) {
        found.current = null;
        return settle({ ...CHECKING, stage: "failed", error: errorMessage(error) });
      }
    },
    [settle],
  );

  useEffect(() => {
    void check();
  }, [check]);

  const install = useCallback(async (): Promise<UpdaterState> => {
    const update = found.current;
    // The release moved on, or the check never found one: look again rather than
    // install something that is no longer there.
    if (!update) return check(true);

    const version = update.version;
    const notes = notesOf(update);
    // null percent until the release turns out to advertise a size; the panel
    // shows an indeterminate bar for as long as it stays null.
    settle({ stage: "downloading", version, notes, percent: null, error: null });

    // One render per whole percent instead of one per chunk.
    let announced = 0;
    try {
      await installUpdate(update, ({ received, total }) => {
        if (!total) return;
        const percent = Math.min(received / total, 1);
        const whole = Math.round(percent * 100);
        if (whole === announced) return;
        announced = whole;
        settle({ stage: "downloading", version, notes, percent, error: null });
      });
      return settle({ stage: "downloading", version, notes, percent: 1, error: null });
    } catch (error) {
      return settle({
        stage: "failed",
        version,
        notes,
        percent: null,
        error: errorMessage(error),
      });
    }
  }, [check, settle]);

  return { state, check, install };
}
