import { useCallback, useEffect, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import {
  Database,
  Eraser,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  HardDriveDownload,
  Info,
  Monitor,
  RefreshCw,
  RotateCcw,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell } from "../components/AppShell";
import { StatusDot } from "../components/StatusBar";
import { UpdateCheck } from "../components/UpdateCheck";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SelectField } from "../components/ui/Field";
import { Spinner } from "../components/ui/Spinner";
import { Toggle } from "../components/ui/Toggle";
import { useAppInfo } from "../hooks/useAppInfo";
import { useDatabase } from "../hooks/useDatabase";
import { useSettings } from "../hooks/useSettings";
import { attempt, clearCache, exportToExcel, getDataLocations } from "../lib/api";
import { PAGE_SIZE_OPTIONS, REPOSITORY_URL } from "../lib/constants";
import { EM_DASH, formatBytes } from "../lib/format";
import { useToast } from "../lib/toast";
import type { DataLocations, ThemeSource } from "../lib/types";
import { REGIONS } from "../utils/regionsData";

const THEMES: { value: ThemeSource; label: string }[] = [
  { value: "system", label: "Follow the system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type Job = "backup" | "excel" | "cache" | null;

function Panel({
  icon: Icon,
  title,
  description,
  className = "",
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-accent" aria-hidden="true" />
          {title}
        </h2>
        <p className="mt-1 text-xs text-dim">{description}</p>
      </header>
      {children}
    </section>
  );
}

/** A path plus its label. Paths stay selectable so they can be copied out. */
function PathRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <dt className="shrink-0 text-xs text-dim">{label}</dt>
      <dd className="min-w-0 text-right text-xs break-anywhere">{value}</dd>
    </div>
  );
}

export function Settings() {
  const toast = useToast();
  const { settings, saving, update, reset } = useSettings();
  const info = useAppInfo();
  const { backupDatabase } = useDatabase();

  const [locations, setLocations] = useState<DataLocations | null>(null);
  const [job, setJob] = useState<Job>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const refreshLocations = useCallback(async () => {
    const result = await attempt(getDataLocations);
    if (result.success) setLocations(result.data);
  }, []);

  useEffect(() => {
    void refreshLocations();
  }, [refreshLocations]);

  const chooseBackupFolder = async () => {
    const folder = await open({
      directory: true,
      multiple: false,
      title: "Choose a backup folder",
      ...(settings.backupFolder ? { defaultPath: settings.backupFolder } : {}),
    });
    if (typeof folder === "string") await update({ backupFolder: folder });
  };

  const runBackup = async () => {
    setJob("backup");
    const result = await backupDatabase(null);
    setJob(null);

    if (!result.success) {
      toast.error("Backup failed.", result.error);
      return;
    }
    toast.success(`Backup saved (${formatBytes(result.data.bytes)}).`, result.data.path);
  };

  const runExcelExport = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const target = await save({
      title: "Export all records to Excel",
      defaultPath: `cendrive-export-${stamp}.xlsx`,
      filters: [{ name: "Excel workbook", extensions: ["xlsx"] }],
    });
    if (!target) return;

    setJob("excel");
    const result = await attempt(() => exportToExcel(target));
    setJob(null);

    if (!result.success) {
      toast.error("Export failed.", result.error);
      return;
    }
    toast.success(`Workbook written (${formatBytes(result.data.bytes)}).`, result.data.path);
  };

  const runClearCache = async () => {
    setJob("cache");
    const result = await attempt(clearCache);
    setJob(null);

    if (!result.success) {
      toast.error("Could not compact the database.", result.error);
      return;
    }

    await refreshLocations();
    toast.success(
      result.data.bytesFreed > 0
        ? `Database compacted, ${formatBytes(result.data.bytesFreed)} reclaimed.`
        : "Database compacted. It was already at its smallest size.",
    );
  };

  return (
    <AppShell
      subtitle="Settings"
      title="Settings"
      description="Every option here is applied and stored on disk; nothing is decorative."
      status={
        <StatusDot tone={saving || job !== null ? "busy" : "ok"}>
          {job === "backup"
            ? "Backing up the database…"
            : job === "excel"
              ? "Writing the workbook…"
              : job === "cache"
                ? "Compacting the database…"
                : saving
                  ? "Saving settings…"
                  : "Settings saved"}
        </StatusDot>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Panel
          icon={Monitor}
          title="Appearance"
          description="The theme is applied to the window frame as well as the interface."
        >
          <SelectField
            label="Theme"
            value={settings.theme}
            disabled={saving}
            onChange={(event) =>
              void update({ theme: event.target.value as ThemeSource })
            }
          >
            {THEMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <div className="mt-2 divide-y divide-line">
            <Toggle
              label="Compact tables"
              description="Tighter rows so more records fit on screen."
              checked={settings.compactTables}
              disabled={saving}
              onChange={(checked) => void update({ compactTables: checked })}
            />
            <Toggle
              label="Reduce motion"
              description="Removes transitions and animation, regardless of the system setting."
              checked={settings.reduceMotion}
              disabled={saving}
              onChange={(checked) => void update({ reduceMotion: checked })}
            />
          </div>
        </Panel>

        <Panel
          icon={Table2}
          title="Records"
          description="Defaults for the dashboard list and the data entry form."
        >
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Records per page"
              value={String(settings.recordsPerPage)}
              disabled={saving}
              onChange={(event) =>
                void update({ recordsPerPage: Number(event.target.value) })
              }
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Default region"
              value={settings.defaultRegion ?? ""}
              disabled={saving}
              help="Pre-selected when you start a new record."
              onChange={(event) =>
                void update({ defaultRegion: event.target.value || null })
              }
            >
              <option value="">No default</option>
              {REGIONS.map((region) => (
                <option key={region.slug} value={region.slug}>
                  {region.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="mt-2">
            <Toggle
              label="Confirm before deleting"
              description="Ask for confirmation before a household and its members are removed."
              checked={settings.confirmDeletes}
              disabled={saving}
              onChange={(checked) => void update({ confirmDeletes: checked })}
            />
          </div>
        </Panel>

        <Panel
          icon={HardDriveDownload}
          title="Backups and export"
          description="A backup is a full copy of the database file, safe to take while the app runs."
        >
          <div className="mb-3">
            <p className="label">Backup folder</p>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xs" title={settings.backupFolder ?? ""}>
                {settings.backupFolder ?? "A “backups” folder beside the database"}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void chooseBackupFolder()}
                disabled={saving}
              >
                <FolderOpen className="size-3.5" aria-hidden="true" />
                Change
              </button>
              {settings.backupFolder ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void update({ backupFolder: null })}
                  disabled={saving}
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void runBackup()}
              disabled={job !== null}
            >
              {job === "backup" ? (
                <Spinner label="Backing up" />
              ) : (
                <HardDriveDownload className="size-4" aria-hidden="true" />
              )}
              Back up now
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void runExcelExport()}
              disabled={job !== null}
            >
              {job === "excel" ? (
                <Spinner label="Exporting" />
              ) : (
                <FileSpreadsheet className="size-4" aria-hidden="true" />
              )}
              Export to Excel
            </button>
          </div>
        </Panel>

        <Panel
          icon={Eraser}
          title="Maintenance"
          description="Compacting rewrites the database file to reclaim space left by deleted rows."
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void runClearCache()}
              disabled={job !== null}
            >
              {job === "cache" ? (
                <Spinner label="Compacting" />
              ) : (
                <Eraser className="size-4" aria-hidden="true" />
              )}
              Compact database
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmReset(true)}
              disabled={saving}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restore default settings
            </button>
          </div>
        </Panel>

        <Panel
          icon={Database}
          title="Data locations"
          description="Everything is stored locally on this computer; nothing leaves the machine."
        >
          {locations ? (
            <>
              <dl>
                <PathRow label="Database" value={locations.database} />
                <PathRow label="Settings" value={locations.settings} />
                <PathRow label="Size on disk" value={formatBytes(locations.bytes)} />
              </dl>
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => void openPath(locations.folder)}
              >
                <FolderOpen className="size-3.5" aria-hidden="true" />
                Open data folder
              </button>
            </>
          ) : (
            <p className="text-xs text-dim">Reading the data folder…</p>
          )}
        </Panel>

        <Panel
          icon={Info}
          title="About CenDrive"
          description="Versions are reported by the running application, not hard-coded."
        >
          <dl>
            <PathRow label="Version" value={info ? info.app.version : EM_DASH} />
            <PathRow
              label="Build"
              value={info ? `${info.runtime.buildProfile} · ${info.runtime.osArch}` : EM_DASH}
            />
            <PathRow label="Tauri" value={info ? info.runtime.tauri : EM_DASH} />
            <PathRow label="WebView2" value={info ? info.runtime.webview : EM_DASH} />
            <PathRow label="Rust" value={info ? info.runtime.rustc : EM_DASH} />
            <PathRow label="SQLite" value={info ? info.libs.sqlite : EM_DASH} />
            <PathRow label="Licence" value={info ? info.app.license : EM_DASH} />
          </dl>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => void openUrl(REPOSITORY_URL)}
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Project repository
          </button>
        </Panel>

        <Panel
          icon={RefreshCw}
          title="Updates"
          description="CenDrive asks its GitHub releases for a newer signed installer; it never sends anything about your data."
          className="col-span-2"
        >
          <UpdateCheck />
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Restore default settings?"
        message="Theme, page size, default region and backup folder go back to their defaults. Your records are not touched."
        confirmLabel="Restore defaults"
        destructive
        busy={saving}
        onConfirm={() => {
          setConfirmReset(false);
          void reset();
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </AppShell>
  );
}
