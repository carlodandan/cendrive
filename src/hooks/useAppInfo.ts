import { useEffect, useState } from "react";

import { getAppInfo } from "../lib/api";
import type { AppInfo } from "../lib/types";

/**
 * Build metadata never changes while the app runs, so the first caller's request
 * is shared with everyone else instead of each screen invoking again.
 */
let cached: Promise<AppInfo> | null = null;

function load(): Promise<AppInfo> {
  cached ??= getAppInfo();
  return cached;
}

export function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    let active = true;
    load()
      .then((value) => {
        if (active) setInfo(value);
      })
      .catch(() => {
        // Version strings are decoration; a failure here must not break a screen.
        cached = null;
      });
    return () => {
      active = false;
    };
  }, []);

  return info;
}
