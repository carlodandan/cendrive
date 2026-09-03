import { NavLink } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Home,
  Settings as SettingsIcon,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSettings } from "../hooks/useSettings";
import { formatNumber } from "../lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/data-entry", label: "Data Entry", icon: UserPlus },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

/**
 * `householdCount` is passed by whichever screen already knows it, so the
 * sidebar never issues its own query.
 */
export function Sidebar({ householdCount }: { householdCount?: number }) {
  const { settings, update } = useSettings();
  const collapsed = settings.sidebarCollapsed;

  return (
    <nav
      aria-label="Main"
      className={`flex shrink-0 flex-col border-r border-line bg-surface no-select ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <ul className="flex-1 space-y-1 p-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-dim hover:bg-surface-2 hover:text-body"
                } ${collapsed ? "justify-center px-0" : ""}`
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {householdCount !== undefined && !collapsed ? (
        <div className="mx-2 mb-2 rounded-md border border-line bg-canvas px-3 py-2.5">
          <p className="text-xs text-faint">Households</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatNumber(householdCount)}
          </p>
        </div>
      ) : null}

      <div className="border-t border-line p-2">
        <button
          type="button"
          className={`btn btn-ghost btn-sm w-full ${collapsed ? "px-0" : "justify-start"}`}
          onClick={() => void update({ sidebarCollapsed: !collapsed })}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronsLeft className="size-4" aria-hidden="true" />
          )}
          <span className={collapsed ? "sr-only" : ""}>
            {collapsed ? "Expand sidebar" : "Collapse"}
          </span>
        </button>
      </div>
    </nav>
  );
}
