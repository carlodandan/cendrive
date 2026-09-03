import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import { Dashboard } from "./pages/Dashboard";
import { DataEntry } from "./pages/DataEntry";
import { HouseholdEdit } from "./pages/HouseholdEdit";
import { LandingPage } from "./pages/LandingPage";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

/**
 * `HashRouter` because the app is served from the bundled files: there is no
 * server to rewrite deep paths.
 */
export function App() {
  return (
    <HashRouter>
      {/* Keyboard users can jump straight past the chrome on every screen. */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/household/:id" element={<HouseholdEdit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
