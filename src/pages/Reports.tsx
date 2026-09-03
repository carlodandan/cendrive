import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";

import { AppShell } from "../components/AppShell";
import { StatusDot } from "../components/StatusBar";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { useDatabase } from "../hooks/useDatabase";
import { attempt, exportReportCsv } from "../lib/api";
import {
  csvRow,
  formatDecimal,
  formatNumber,
  parseTimestamp,
} from "../lib/format";
import { useToast } from "../lib/toast";
import type { Household } from "../lib/types";

type TimeFilter = "all" | "month" | "week";

const FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "month", label: "Last month" },
  { value: "week", label: "Last 7 days" },
];

/**
 * A fresh `Date` per call. The Electron build reused one instance and applied
 * both `setDate` and `setMonth` to it, so its "one month" window was really a
 * month and a week.
 */
function cutoffFor(filter: TimeFilter): Date | null {
  if (filter === "all") return null;
  const date = new Date();
  if (filter === "month") date.setMonth(date.getMonth() - 1);
  else date.setDate(date.getDate() - 7);
  return date;
}

function createdSince(household: Household, cutoff: Date): boolean {
  const created = parseTimestamp(household.createdAt);
  return created !== null && created >= cutoff;
}

interface Group {
  name: string;
  parent: string;
  count: number;
  members: number;
  children: number;
  share: number;
}

interface Bucket {
  count: number;
  members: number;
  parent: string;
  children: Set<string>;
}

const UNSPECIFIED = "Unspecified";

/** Region rows have no parent locality; the label keeps the CSV column filled. */
const ROOT = "Philippines";

function toGroups(buckets: Map<string, Bucket>, total: number): Group[] {
  return [...buckets.entries()]
    .map(([name, bucket]) => ({
      name,
      parent: bucket.parent,
      count: bucket.count,
      members: bucket.members,
      children: bucket.children.size,
      share: total > 0 ? (bucket.count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function bucketFor(
  buckets: Map<string, Bucket>,
  key: string,
  parent: string,
): Bucket {
  const existing = buckets.get(key);
  if (existing) return existing;
  const created: Bucket = { count: 0, members: 0, parent, children: new Set() };
  buckets.set(key, created);
  return created;
}

interface Analytics {
  byRegion: Group[];
  byProvince: Group[];
  byTown: Group[];
  households: number;
  members: number;
  weekly: number;
  monthly: number;
}

function analyse(households: Household[], filter: TimeFilter): Analytics {
  const cutoff = cutoffFor(filter);
  const rows = cutoff ? households.filter((row) => createdSince(row, cutoff)) : households;

  const regions = new Map<string, Bucket>();
  const provinces = new Map<string, Bucket>();
  const towns = new Map<string, Bucket>();
  let members = 0;

  for (const row of rows) {
    const region = row.region?.trim() || UNSPECIFIED;
    const province = row.province?.trim() || UNSPECIFIED;
    const town = row.town?.trim();
    members += row.familyCount;

    const regionBucket = bucketFor(regions, region, ROOT);
    regionBucket.count += 1;
    regionBucket.members += row.familyCount;
    if (town) regionBucket.children.add(`${province}|${town}`);

    const provinceBucket = bucketFor(provinces, province, region);
    provinceBucket.count += 1;
    provinceBucket.members += row.familyCount;
    if (town) provinceBucket.children.add(town);

    if (town) {
      const townBucket = bucketFor(towns, `${town}, ${province}`, province);
      townBucket.count += 1;
      townBucket.members += row.familyCount;
    }
  }

  const weekCutoff = cutoffFor("week");
  const monthCutoff = cutoffFor("month");

  return {
    byRegion: toGroups(regions, rows.length),
    byProvince: toGroups(provinces, rows.length),
    byTown: toGroups(towns, rows.length),
    households: rows.length,
    members,
    weekly: weekCutoff ? rows.filter((row) => createdSince(row, weekCutoff)).length : 0,
    monthly: monthCutoff ? rows.filter((row) => createdSince(row, monthCutoff)).length : 0,
  };
}

/** Levels are exported together so aggregates and localities stay comparable. */
function reportCsv(analytics: Analytics): string {
  const header = csvRow([
    "Level",
    "Name",
    "Within",
    "Households",
    "Family members",
    "Share of records",
    "Average family size",
  ]);

  const line = (level: string, group: Group) =>
    csvRow([
      level,
      group.name,
      group.parent,
      group.count,
      group.members,
      `${formatDecimal(group.share)}%`,
      formatDecimal(group.count > 0 ? group.members / group.count : 0),
    ]);

  return [
    header,
    ...analytics.byRegion.map((group) => line("Region", group)),
    ...analytics.byProvince.map((group) => line("Province", group)),
    ...analytics.byTown.map((group) => line("City or municipality", group)),
  ].join("\r\n");
}

type SectionKey = "region" | "province" | "town";

export function Reports() {
  const toast = useToast();
  const { getAllHouseholds, loading } = useDatabase();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    region: true,
    province: true,
    town: false,
  });

  const load = useCallback(async () => {
    const result = await getAllHouseholds();
    if (result.success) setHouseholds(result.data);
    else toast.error("Could not load records.", result.error);
    setReady(true);
  }, [getAllHouseholds, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const analytics = useMemo(() => analyse(households, filter), [households, filter]);

  const handleExport = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const target = await save({
      title: "Export report as CSV",
      defaultPath: `cendrive-report-${stamp}.csv`,
      filters: [{ name: "CSV spreadsheet", extensions: ["csv"] }],
    });
    if (!target) return;

    setExporting(true);
    const result = await attempt(() => exportReportCsv(target, reportCsv(analytics)));
    setExporting(false);

    if (result.success) {
      toast.success("Report exported.", result.data.path);
    } else {
      toast.error("Could not export the report.", result.error);
    }
  };

  return (
    <AppShell
      subtitle="Reports"
      title="Coverage report"
      description="Where the records come from, grouped by region, province and locality."
      actions={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? (
              <Spinner label="Refreshing" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleExport()}
            disabled={exporting || analytics.households === 0}
          >
            {exporting ? (
              <Spinner label="Exporting" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            Export CSV
          </button>
        </>
      }
      status={
        <StatusDot tone={loading ? "busy" : "ok"}>
          {loading
            ? "Reading database…"
            : `${formatNumber(analytics.households)} record${
                analytics.households === 1 ? "" : "s"
              } in this view`}
        </StatusDot>
      }
    >
      <div
        className="mb-4 inline-flex rounded-md border border-line bg-surface p-1"
        role="group"
        aria-label="Time range"
      >
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`btn btn-sm ${
              filter === option.value
                ? "bg-accent-soft font-medium text-accent"
                : "text-dim hover:bg-surface-2 hover:text-body"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="card">
          <LoadingBlock caption="Building the report…" />
        </div>
      ) : analytics.households === 0 ? (
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="Nothing to report yet"
            description={
              households.length === 0
                ? "Add household records and this report will summarise where they come from."
                : "No records fall inside the selected time range. Try a wider range."
            }
            {...(households.length > 0
              ? {
                  action: (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setFilter("all")}
                    >
                      Show all time
                    </button>
                  ),
                }
              : {})}
          />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-4 gap-4">
            <Metric label="Households" value={formatNumber(analytics.households)} />
            <Metric label="Family members" value={formatNumber(analytics.members)} />
            <Metric
              label="Average family size"
              value={formatDecimal(
                analytics.households > 0 ? analytics.members / analytics.households : 0,
              )}
            />
            <Metric
              label="Localities covered"
              value={formatNumber(analytics.byTown.length)}
            />
          </dl>

          <dl className="mt-4 grid grid-cols-3 gap-4">
            <Metric label="Regions" value={formatNumber(analytics.byRegion.length)} />
            <Metric
              label="Added in the last 7 days"
              value={formatNumber(analytics.weekly)}
            />
            <Metric
              label="Added in the last month"
              value={formatNumber(analytics.monthly)}
            />
          </dl>

          <div className="mt-6 space-y-4">
            <Section
              title="By region"
              unit="region"
              groups={analytics.byRegion}
              childLabel="localities"
              expanded={open.region}
              onToggle={() => setOpen((current) => ({ ...current, region: !current.region }))}
            />
            <Section
              title="By province"
              unit="province"
              groups={analytics.byProvince}
              childLabel="localities"
              expanded={open.province}
              onToggle={() =>
                setOpen((current) => ({ ...current, province: !current.province }))
              }
            />
            <Section
              title="By city or municipality"
              unit="locality"
              groups={analytics.byTown}
              expanded={open.town}
              onToggle={() => setOpen((current) => ({ ...current, town: !current.town }))}
            />
          </div>
        </>
      )}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium text-dim">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * A collapsible breakdown. The share is drawn as a bar and printed as a number,
 * so the ranking never depends on reading the bar.
 */
function Section({
  title,
  unit,
  groups,
  childLabel,
  expanded,
  onToggle,
}: {
  title: string;
  unit: string;
  groups: Group[];
  childLabel?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <section className="card overflow-hidden">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left
            text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          <span className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="size-4 text-faint" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4 text-faint" aria-hidden="true" />
            )}
            {title}
          </span>
          <span className="text-xs font-normal text-faint tabular-nums">
            {formatNumber(groups.length)} {groups.length === 1 ? unit : `${unit}s`}
          </span>
        </button>
      </h2>

      {expanded ? (
        <div id={panelId} className="border-t border-line">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className="w-64">
                  Share of records
                </th>
                <th scope="col" className="text-right">
                  Households
                </th>
                <th scope="col" className="text-right">
                  Members
                </th>
                {childLabel ? (
                  <th scope="col" className="text-right capitalize">
                    {childLabel}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.name}>
                  <td>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-faint">{group.parent}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        aria-hidden="true"
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                      >
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.max(group.share, 1.5)}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs text-dim tabular-nums">
                        {formatDecimal(group.share)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums">{formatNumber(group.count)}</td>
                  <td className="text-right tabular-nums">{formatNumber(group.members)}</td>
                  {childLabel ? (
                    <td className="text-right tabular-nums">
                      {formatNumber(group.children)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
