import { check } from "@tauri-apps/plugin-updater";
import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * The updater reads `plugins.updater` in `tauri.conf.json`: it asks GitHub for
 * `latest.json` and refuses anything whose signature does not match the public
 * key in that file. Nothing here can turn the check off — a build without a key
 * simply fails the check, which is why the startup check stays quiet about it.
 */

/** Bytes downloaded so far, and the total when the release advertises one. */
export interface DownloadProgress {
  received: number;
  total: number | null;
}

/**
 * The first check is shared. The startup check and the Settings panel are
 * looking at the same release, and asking twice only invites them to disagree.
 * Failures are not kept, so a retry really does retry.
 */
let pending: Promise<Update | null> | null = null;

export function checkForUpdate(force = false): Promise<Update | null> {
  if (force) pending = null;
  pending ??= check().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

/**
 * Downloads and installs one update, reporting progress as it goes.
 *
 * On Windows the installer replaces the running application, so the process is
 * gone before this resolves: treat everything after the download as unreachable
 * there rather than as the success path.
 */
export async function installUpdate(
  update: Update,
  onProgress: (progress: DownloadProgress) => void,
): Promise<void> {
  let received = 0;
  let total: number | null = null;

  await update.downloadAndInstall((event: DownloadEvent) => {
    if (event.event === "Started") {
      total = event.data.contentLength ?? null;
    } else if (event.event === "Progress") {
      received += event.data.chunkLength;
    }
    onProgress({ received, total });
  });

  // Reached on the platforms that hand the restart back to the caller.
  await relaunch();
}
