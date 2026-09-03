import type { ReactNode } from "react";

import { useAppInfo } from "../hooks/useAppInfo";

/**
 * Only facts the app can prove: the database state each screen reports, and the
 * version and platform the backend actually returned.
 */
export function StatusBar({ children }: { children?: ReactNode }) {
  const info = useAppInfo();

  return (
    <footer
      className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-line
        bg-surface px-3 text-xs text-dim no-select"
    >
      <div className="flex min-w-0 items-center gap-3">{children}</div>
      <div className="flex shrink-0 items-center gap-3">
        {info ? (
          <>
            <span>SQLite {info.libs.sqlite}</span>
            <span aria-hidden="true" className="text-line-strong">
              |
            </span>
            <span>
              v{info.app.version} · {info.runtime.osArch}
            </span>
          </>
        ) : null}
      </div>
    </footer>
  );
}

/** A small labelled dot; `tone` maps to the semantic status colours. */
export function StatusDot({
  tone,
  children,
}: {
  tone: "ok" | "busy" | "bad";
  children: ReactNode;
}) {
  const color =
    tone === "ok" ? "bg-ok" : tone === "busy" ? "bg-warn animate-pulse" : "bg-bad";

  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-2 rounded-full ${color}`} />
      <span>{children}</span>
    </span>
  );
}
