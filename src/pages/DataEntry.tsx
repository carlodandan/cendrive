import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { HouseholdForm, emptyFormValue } from "../components/HouseholdForm";
import { StatusDot } from "../components/StatusBar";
import { useDatabase } from "../hooks/useDatabase";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "../lib/toast";
import type { RecordInput } from "../lib/types";

/**
 * Create route. The blank value is built once so the form's dirty check has a
 * stable baseline, and the default region from Settings is pre-selected.
 */
export function DataEntry() {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { saveCensusRecord, loading } = useDatabase();

  const [initial] = useState(() => emptyFormValue(settings.defaultRegion));

  const handleSubmit = async (record: RecordInput) => {
    const result = await saveCensusRecord(record);

    if (!result.success) {
      toast.error("Could not save this record.", result.error);
      return;
    }

    toast.success(
      "Household saved.",
      `Stored as record #${result.data}${
        record.familyMembers.length > 0
          ? ` with ${record.familyMembers.length} family member${
              record.familyMembers.length === 1 ? "" : "s"
            }`
          : ""
      }.`,
    );
    navigate("/dashboard");
  };

  return (
    <AppShell
      subtitle="Data Entry"
      title="New household record"
      description="The household head and its location are required; family members are optional."
      status={
        <StatusDot tone={loading ? "busy" : "ok"}>
          {loading ? "Saving record…" : "Ready"}
        </StatusDot>
      }
    >
      <HouseholdForm
        initial={initial}
        submitLabel="Save record"
        submitting={loading}
        onSubmit={(record) => void handleSubmit(record)}
        onCancel={() => navigate("/dashboard")}
      />
    </AppShell>
  );
}
