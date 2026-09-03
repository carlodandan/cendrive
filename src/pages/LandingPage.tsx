import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Database,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBar, StatusDot } from "../components/StatusBar";
import { BrandLogo, TitleBar, Wordmark } from "../components/TitleBar";

const HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Local by design",
    body: "Records live in a SQLite file on this computer. Nothing is uploaded.",
  },
  {
    icon: Database,
    title: "Households and families",
    body: "One head per record, with up to thirty family members attached.",
  },
  {
    icon: BarChart3,
    title: "Reports and exports",
    body: "Coverage by region and province, exportable to CSV or Excel.",
  },
];

/** Entry screen. The window has no native frame, so the title bar stays. */
export function LandingPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TitleBar />

      <main
        id="main"
        className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-10"
      >
        <div className="w-full max-w-3xl">
          <div className="text-center">
            <BrandLogo className="mx-auto mb-6 size-16 rounded-2xl shadow-lg" />

            <h1 className="text-3xl font-semibold tracking-tight">
              <Wordmark />
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-dim">
              A desktop database for household census records — entry, search,
              reporting and backups, all offline.
            </p>

            <div className="mt-7 flex items-center justify-center gap-2">
              <Link to="/dashboard" className="btn btn-primary">
                Open dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link to="/data-entry" className="btn btn-secondary">
                <UserPlus className="size-4" aria-hidden="true" />
                New record
              </Link>
            </div>
          </div>

          <ul className="mt-10 grid grid-cols-3 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card p-4">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                <h2 className="mt-2.5 text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-dim">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <StatusBar>
        <StatusDot tone="ok">Ready</StatusDot>
      </StatusBar>
    </div>
  );
}
