import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, RefreshCw } from "lucide-react";

import { useUpdater } from "../hooks/useUpdater";
import { useToast } from "../lib/toast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Spinner } from "./ui/Spinner";

/**
 * The contents of the Settings “Updates” panel: one status line, one action, and
 * a confirmation before anything is downloaded. The check itself is shared with
 * the startup check, so opening Settings does not go back to the network.
 */
export function UpdateCheck() {
  const toast = useToast();
  const { state, check, install } = useUpdater();
  const [confirming, setConfirming] = useState(false);

  const busy = state.stage === "checking" || state.stage === "downloading";

  const runCheck = async () => {
    const next = await check(true);
    if (next.stage === "failed") {
      toast.error("Could not check for updates.", next.error ?? undefined);
    } else if (next.stage === "current") {
      toast.success("CenDrive is up to date.");
    } else {
      toast.info(`CenDrive ${next.version} is available.`);
    }
  };

  const runInstall = async () => {
    setConfirming(false);
    const next = await install();
    if (next.stage === "failed") {
      toast.error("The update could not be installed.", next.error ?? undefined);
    }
  };

  const percentLabel =
    state.percent === null ? null : `${Math.round(state.percent * 100)}%`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          {state.stage === "checking" ? (
            <p className="flex items-center gap-2 text-sm text-dim" role="status">
              <Spinner label="Checking for updates" />
              Checking for a newer release…
            </p>
          ) : null}

          {state.stage === "current" ? (
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-ok" aria-hidden="true" />
              CenDrive is up to date.
            </p>
          ) : null}

          {state.stage === "available" ? (
            <>
              <p className="text-sm font-medium">CenDrive {state.version} is available.</p>
              <p className="mt-0.5 text-xs text-dim">
                The installer is downloaded from the project’s GitHub releases and its
                signature is checked before it runs.
              </p>
            </>
          ) : null}

          {state.stage === "downloading" ? (
            <p className="text-sm" role="status">
              Downloading CenDrive {state.version}
              {percentLabel ? ` — ${percentLabel}` : "…"}
            </p>
          ) : null}

          {state.stage === "failed" ? (
            <>
              <p className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-bad" aria-hidden="true" />
                Could not check for updates.
              </p>
              <p className="mt-0.5 text-xs text-dim break-anywhere">
                {state.error ?? "The release endpoint could not be reached."}
              </p>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {state.stage === "available" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setConfirming(true)}
            >
              <Download className="size-4" aria-hidden="true" />
              Install and restart
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void runCheck()}
            disabled={busy}
          >
            {busy ? (
              <Spinner label="Working" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            {state.stage === "available" ? "Check again" : "Check for updates"}
          </button>
        </div>
      </div>

      {state.stage === "downloading" ? (
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label={`Downloading CenDrive ${state.version}`}
          {...(state.percent === null
            ? {}
            : {
                "aria-valuenow": Math.round(state.percent * 100),
                "aria-valuemin": 0,
                "aria-valuemax": 100,
              })}
        >
          <div
            className={`h-full bg-accent transition-[width] duration-200 ${
              state.percent === null ? "animate-pulse" : ""
            }`}
            style={{ width: percentLabel ?? "100%" }}
          />
        </div>
      ) : null}

      {state.stage === "available" && state.notes ? (
        <div className="mt-4">
          <p className="label">Release notes</p>
          <p className="max-h-28 overflow-y-auto rounded-md border border-line bg-canvas p-3 text-xs whitespace-pre-line text-dim">
            {state.notes}
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={`Install CenDrive ${state.version}?`}
        message="CenDrive closes while the installer replaces it and opens again afterwards. Finish anything you are working on first — records already saved are not affected."
        confirmLabel="Download and install"
        onConfirm={() => void runInstall()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
