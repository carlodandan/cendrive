import { useEffect } from "react";

import { checkForUpdate } from "../lib/updater";
import { useToast } from "../lib/toast";

/**
 * The one automatic check, a few seconds after startup so it never competes with
 * the first paint or the database open. It only speaks when there is something
 * waiting: a failed check is nothing the user asked for, and the Settings panel
 * reports it in full when they do ask.
 */
const DELAY = 4000;

/** One announcement per run, even though StrictMode mounts twice in dev. */
let announced = false;

export function UpdateWatcher() {
  const toast = useToast();

  useEffect(() => {
    if (announced) return;

    const timer = window.setTimeout(() => {
      void checkForUpdate()
        .then((update) => {
          if (!update || announced) return;
          announced = true;
          toast.info(
            `CenDrive ${update.version} is available.`,
            "Install it from Settings.",
          );
        })
        .catch(() => {});
    }, DELAY);

    return () => window.clearTimeout(timer);
  }, [toast]);

  return null;
}
