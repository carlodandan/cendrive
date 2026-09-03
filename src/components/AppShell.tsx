import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TitleBar } from "./TitleBar";

/**
 * One frame for every screen: title bar, sidebar, scrolling main region and
 * status bar. Only the main region scrolls, so the chrome never moves.
 */
export function AppShell({
  subtitle,
  title,
  description,
  actions,
  householdCount,
  status,
  children,
}: {
  subtitle: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  householdCount?: number;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar subtitle={subtitle} />

      <div className="flex min-h-0 flex-1">
        <Sidebar {...(householdCount === undefined ? {} : { householdCount })} />

        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold">{title}</h1>
                {description ? (
                  <p className="mt-1 text-sm text-dim">{description}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
              ) : null}
            </div>

            {children}
          </div>
        </main>
      </div>

      <StatusBar>{status}</StatusBar>
    </div>
  );
}
