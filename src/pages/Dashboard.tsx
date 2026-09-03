import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { AppShell } from "../components/AppShell";
import { StatusDot } from "../components/StatusBar";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, Spinner } from "../components/ui/Spinner";
import { useDatabase } from "../hooks/useDatabase";
import { useSettings } from "../hooks/useSettings";
import {
  addressLine,
  capitalize,
  displayName,
  EM_DASH,
  formatDate,
  formatDecimal,
  formatNumber,
  initials,
} from "../lib/format";
import { useToast } from "../lib/toast";
import type { Household, HouseholdDetail, Statistics } from "../lib/types";

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-dim">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-faint">{hint}</p>
    </div>
  );
}

/** Read-only overview: statistics, search, and a paged table of households. */
export function Dashboard() {
  const toast = useToast();
  const { settings } = useSettings();
  const {
    getAllHouseholds,
    searchHouseholds,
    getStatistics,
    getHouseholdById,
    deleteHousehold,
    loading,
  } = useDatabase();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [term, setTerm] = useState("");
  const [appliedTerm, setAppliedTerm] = useState("");
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, HouseholdDetail>>({});
  const [pendingDelete, setPendingDelete] = useState<Household | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (search: string) => {
      const [list, statistics] = await Promise.all([
        search ? searchHouseholds(search) : getAllHouseholds(),
        getStatistics(),
      ]);

      if (list.success) {
        setHouseholds(list.data);
        setAppliedTerm(search);
        setPage(1);
        setExpandedId(null);
        setDetails({});
      } else {
        toast.error("Could not load records.", list.error);
      }

      if (statistics.success) setStats(statistics.data);
      setReady(true);
    },
    [getAllHouseholds, getStatistics, searchHouseholds, toast],
  );

  useEffect(() => {
    void load("");
  }, [load]);

  const toggleDetails = async (household: Household) => {
    if (expandedId === household.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(household.id);
    if (details[household.id]) return;

    const result = await getHouseholdById(household.id);
    if (result.success) {
      setDetails((current) => ({ ...current, [household.id]: result.data }));
    } else {
      toast.error("Could not load family members.", result.error);
    }
  };

  const runDelete = async (household: Household) => {
    setDeleting(true);
    const result = await deleteHousehold(household.id);
    setDeleting(false);
    setPendingDelete(null);

    if (!result.success) {
      toast.error("Could not delete this record.", result.error);
      return;
    }

    setHouseholds((current) => current.filter((entry) => entry.id !== household.id));
    setDetails((current) => {
      const { [household.id]: _removed, ...rest } = current;
      return rest;
    });
    if (expandedId === household.id) setExpandedId(null);
    toast.success(
      "Household deleted.",
      `${displayName(household)} and its family members were removed.`,
    );

    const statistics = await getStatistics();
    if (statistics.success) setStats(statistics.data);
  };

  const requestDelete = (household: Household) => {
    if (settings.confirmDeletes) setPendingDelete(household);
    else void runDelete(household);
  };

  const perPage = settings.recordsPerPage;
  const pageCount = Math.max(1, Math.ceil(households.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * perPage;
  const visible = households.slice(start, start + perPage);

  return (
    <AppShell
      subtitle="Dashboard"
      title="Household records"
      description={
        appliedTerm
          ? `${formatNumber(households.length)} match${
              households.length === 1 ? "" : "es"
            } for “${appliedTerm}”`
          : `${formatNumber(households.length)} household${
              households.length === 1 ? "" : "s"
            } in the database`
      }
      {...(stats ? { householdCount: stats.totalHouseholds } : {})}
      actions={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void load(appliedTerm)}
            disabled={loading}
          >
            {loading ? <Spinner label="Refreshing" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            Refresh
          </button>
          <Link to="/data-entry" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" />
            New record
          </Link>
        </>
      }
      status={
        <StatusDot tone={loading ? "busy" : "ok"}>
          {loading
            ? "Reading database…"
            : `Database ready · ${formatNumber(households.length)} record${
                households.length === 1 ? "" : "s"
              } listed`}
        </StatusDot>
      }
    >
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Households"
          value={stats ? formatNumber(stats.totalHouseholds) : EM_DASH}
          hint="Records stored locally"
        />
        <StatCard
          label="Family members"
          value={stats ? formatNumber(stats.totalFamilyMembers) : EM_DASH}
          hint="Excluding household heads"
        />
        <StatCard
          label="Average family size"
          value={stats ? formatDecimal(stats.avgFamilySize) : EM_DASH}
          hint="Members per household"
        />
        <StatCard
          label="Largest household"
          value={stats ? formatNumber(stats.maxFamilySize) : EM_DASH}
          hint="Most members recorded"
        />
      </div>

      <form
        className="mt-6 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load(term.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by name, address, contact or email"
            aria-label="Search households"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          Search
        </button>
        {appliedTerm ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTerm("");
              void load("");
            }}
            disabled={loading}
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </form>

      <div className="mt-4">
        {!ready ? (
          <div className="card">
            <LoadingBlock caption="Loading census data…" />
          </div>
        ) : households.length === 0 ? (
          <div className="card">
            {appliedTerm ? (
              <EmptyState
                icon={Search}
                title="No households match that search"
                description={`Nothing found for “${appliedTerm}”. Try part of a name, a barangay, or a contact number.`}
                action={
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setTerm("");
                      void load("");
                    }}
                  >
                    Show all records
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="No households recorded yet"
                description="Add your first household to start building the census database."
                action={
                  <Link to="/data-entry" className="btn btn-primary">
                    <Plus className="size-4" aria-hidden="true" />
                    Add first household
                  </Link>
                }
              />
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Household head</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Address</th>
                    <th scope="col">Members</th>
                    <th scope="col">Added</th>
                    <th scope="col" className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((household) => (
                    <Row
                      key={household.id}
                      household={household}
                      expanded={expandedId === household.id}
                      detail={details[household.id]}
                      onToggle={() => void toggleDetails(household)}
                      onDelete={() => requestDelete(household)}
                      busy={deleting && pendingDelete?.id === household.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 text-xs text-dim">
              <p className="tabular-nums">
                Showing {formatNumber(start + 1)}–{formatNumber(start + visible.length)} of{" "}
                {formatNumber(households.length)}
              </p>
              {pageCount > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </button>
                  <span className="tabular-nums">
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= pageCount}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this household?"
        message={
          pendingDelete
            ? `${displayName(pendingDelete)} and ${pendingDelete.familyCount} family member record${
                pendingDelete.familyCount === 1 ? "" : "s"
              } will be removed permanently. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onConfirm={() => {
          if (pendingDelete) void runDelete(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  );
}

/**
 * A household plus its optional expanded panel. Both live in the same table
 * body, so the panel is a second row spanning every column.
 */
function Row({
  household,
  expanded,
  detail,
  onToggle,
  onDelete,
  busy,
}: {
  household: Household;
  expanded: boolean;
  detail: HouseholdDetail | undefined;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const address = addressLine(household);

  return (
    <>
      <tr>
        <td>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md
                bg-accent-soft text-xs font-semibold text-accent"
            >
              {initials(household)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName(household)}</p>
              <p className="text-xs text-faint tabular-nums">#{household.id}</p>
            </div>
          </div>
        </td>

        <td>
          {household.contactNumber || household.emailAddress ? (
            <div className="space-y-0.5 text-xs">
              {household.contactNumber ? (
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
                  <span className="truncate">{household.contactNumber}</span>
                </p>
              ) : null}
              {household.emailAddress ? (
                <p className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
                  <span className="truncate">{household.emailAddress}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <span className="text-xs text-faint">No contact details</span>
          )}
        </td>

        <td className="max-w-xs">
          <p className="truncate text-xs" title={address}>
            {address}
          </p>
          <p className="truncate text-xs text-faint">{household.region ?? EM_DASH}</p>
        </td>

        <td>
          <div className="flex items-center gap-2">
            <span
              className={`chip ${household.familyCount > 0 ? "chip-accent" : "chip-neutral"} tabular-nums`}
            >
              {household.familyCount}
            </span>
            {household.familyCount > 0 ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={`members-${household.id}`}
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                )}
                {expanded ? "Hide" : "Show"}
              </button>
            ) : null}
          </div>
        </td>

        <td className="text-xs whitespace-nowrap text-dim tabular-nums">
          {formatDate(household.createdAt)}
        </td>

        <td>
          <div className="flex justify-end gap-1">
            <Link
              to={`/household/${household.id}`}
              className="btn btn-ghost btn-sm"
              title="Edit this record"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm text-faint hover:text-bad"
              onClick={onDelete}
              disabled={busy}
              aria-label={`Delete ${displayName(household)}`}
              title="Delete this record"
            >
              {busy ? (
                <Spinner label="Deleting" className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={6} className="bg-canvas p-0">
            <div id={`members-${household.id}`} className="px-3 py-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-dim">
                <Users className="size-3.5" aria-hidden="true" />
                Family members
              </h3>

              {!detail ? (
                <p className="flex items-center gap-2 text-xs text-dim">
                  <Spinner label="Loading family members" className="size-3.5" />
                  Loading family members…
                </p>
              ) : detail.familyMembers.length === 0 ? (
                <p className="text-xs text-faint">
                  No family members are recorded for this household.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-2">
                  {detail.familyMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-md border
                        border-line bg-surface px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-faint">
                          {capitalize(member.relationship)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-dim tabular-nums">
                        {member.age === null ? EM_DASH : `${member.age} yrs`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
