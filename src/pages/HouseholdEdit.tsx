import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Trash2 } from "lucide-react";

import { AppShell } from "../components/AppShell";
import { HouseholdForm, formValueFromDetail } from "../components/HouseholdForm";
import type { HouseholdFormValue } from "../components/HouseholdForm";
import { StatusDot } from "../components/StatusBar";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock } from "../components/ui/Spinner";
import { useDatabase } from "../hooks/useDatabase";
import { useSettings } from "../hooks/useSettings";
import { displayName } from "../lib/format";
import { useToast } from "../lib/toast";
import type { HouseholdDetail, RecordInput } from "../lib/types";

/** Edit route for `/household/:id`, sharing the create form. */
export function HouseholdEdit() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const { getHouseholdById, updateHousehold, deleteHousehold } = useDatabase();

  const id = Number(params.id);
  const [detail, setDetail] = useState<HouseholdDetail | null>(null);
  const [initial, setInitial] = useState<HouseholdFormValue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setLoadError("That record number is not valid.");
      return;
    }

    let active = true;
    void getHouseholdById(id).then((result) => {
      if (!active) return;
      if (result.success) {
        setDetail(result.data);
        setInitial(formValueFromDetail(result.data));
      } else {
        setLoadError(result.error);
      }
    });

    return () => {
      active = false;
    };
  }, [id, getHouseholdById]);

  const handleSubmit = async (record: RecordInput) => {
    setSaving(true);
    const result = await updateHousehold(id, record);
    setSaving(false);

    if (!result.success) {
      toast.error("Could not save your changes.", result.error);
      return;
    }

    toast.success("Changes saved.", `Record #${id} has been updated.`);
    navigate("/dashboard");
  };

  const runDelete = useCallback(async () => {
    setDeleting(true);
    const result = await deleteHousehold(id);
    setDeleting(false);
    setConfirmDelete(false);

    if (!result.success) {
      toast.error("Could not delete this record.", result.error);
      return;
    }

    toast.success("Household deleted.", "Its family members were removed with it.");
    navigate("/dashboard");
  }, [deleteHousehold, id, navigate, toast]);

  const requestDelete = () => {
    if (settings.confirmDeletes) setConfirmDelete(true);
    else void runDelete();
  };

  const heading = detail ? displayName(detail) : "Household record";

  return (
    <AppShell
      subtitle="Edit record"
      title={heading}
      description={
        detail
          ? `Record #${detail.id} · ${detail.familyCount} family member${
              detail.familyCount === 1 ? "" : "s"
            }`
          : "Loading this household…"
      }
      status={
        <StatusDot tone={loadError ? "bad" : saving || deleting ? "busy" : "ok"}>
          {loadError
            ? "Record unavailable"
            : deleting
              ? "Deleting record…"
              : saving
                ? "Saving changes…"
                : "Ready"}
        </StatusDot>
      }
    >
      {loadError ? (
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="This record could not be opened"
            description={loadError}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/dashboard")}
              >
                Back to dashboard
              </button>
            }
          />
        </div>
      ) : initial ? (
        <>
          <HouseholdForm
            initial={initial}
            submitLabel="Save changes"
            submitting={saving || deleting}
            onSubmit={(record) => void handleSubmit(record)}
            onCancel={() => navigate("/dashboard")}
            secondaryAction={
              <button
                type="button"
                className="btn btn-danger mr-auto"
                onClick={requestDelete}
                disabled={saving || deleting}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete record
              </button>
            }
          />

          <ConfirmDialog
            open={confirmDelete}
            title="Delete this household?"
            message={`${heading} and ${detail?.familyCount ?? 0} family member record${
              detail?.familyCount === 1 ? "" : "s"
            } will be removed permanently. This cannot be undone.`}
            confirmLabel="Delete"
            destructive
            busy={deleting}
            onConfirm={() => void runDelete()}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      ) : (
        <div className="card">
          <LoadingBlock caption="Loading this household…" />
        </div>
      )}
    </AppShell>
  );
}
