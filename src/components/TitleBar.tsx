import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";

// The same artwork the installer and the taskbar use, so the window agrees with
// the shortcut that opened it. Vite fingerprints it into dist/assets/.
import logo from "../../icons/cendrive_256x256.png";

const appWindow = getCurrentWindow();

/** Wordmark: "Cen" keeps the amber accent, "Drive" the gradient. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-mark">Cen</span>
      <span className="wordmark">Drive</span>
    </span>
  );
}

/**
 * The application icon, on a white chip rather than the brand gradient: the
 * artwork carries its own white background, so a gradient behind it would only
 * show as a pale square. The ring keeps the chip's edge visible in light mode,
 * where the surface behind it is also white.
 *
 * Decorative in both places it appears — the wordmark beside it already names
 * the app — so it stays out of the accessibility tree.
 *
 * `dragRegion` marks it as part of the title bar's drag surface. Without it the
 * image would swallow the drag, because Tauri looks for the attribute on the
 * element under the pointer.
 */
export function BrandLogo({
  className = "size-5 rounded",
  dragRegion = false,
}: {
  className?: string;
  dragRegion?: boolean;
}) {
  const drag = dragRegion ? { "data-tauri-drag-region": true } : {};
  return (
    <span
      {...drag}
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden
        bg-white ring-1 ring-line ${className}`}
    >
      <img
        {...drag}
        src={logo}
        alt=""
        draggable={false}
        className="size-full object-contain"
      />
    </span>
  );
}

/**
 * The window is borderless, so this bar is the title bar: the drag region is a
 * real `data-tauri-drag-region` element (Tauri handles dragging and
 * double-click-to-maximize) and the three controls follow the Windows order.
 */
export function TitleBar({ subtitle }: { subtitle?: string }) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let active = true;

    const sync = () => {
      void appWindow.isMaximized().then((value) => {
        if (active) setMaximized(value);
      });
    };

    sync();
    void appWindow.onResized(sync).then((stop) => {
      if (active) unlisten = stop;
      else stop();
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  return (
    <header className="flex h-9 shrink-0 items-center justify-between border-b border-line bg-surface no-select">
      <div
        data-tauri-drag-region
        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-2.5"
      >
        <BrandLogo className="size-5 rounded" dragRegion />
        <p
          data-tauri-drag-region
          className="truncate text-xs font-semibold tracking-tight"
        >
          <Wordmark />
          {subtitle ? <span className="font-normal text-dim">{` — ${subtitle}`}</span> : null}
        </p>
      </div>

      <div className="flex h-full shrink-0 items-stretch">
        <button
          type="button"
          className="titlebar-btn"
          onClick={() => void appWindow.minimize()}
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="titlebar-btn"
          onClick={() => void appWindow.toggleMaximize()}
          aria-label={maximized ? "Restore" : "Maximize"}
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? (
            <Copy className="size-3.5" aria-hidden="true" />
          ) : (
            <Square className="size-3.5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="titlebar-btn titlebar-btn-close"
          onClick={() => void appWindow.close()}
          aria-label="Close"
          title="Close"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
