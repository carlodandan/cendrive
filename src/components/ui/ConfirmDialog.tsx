import { useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";

import { Spinner } from "./Spinner";

/**
 * Built on `<dialog>`: the platform supplies the focus trap, Escape handling and
 * an inert background, so none of that is reimplemented here. The cancel button
 * takes initial focus because these dialogs guard destructive actions.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = `${titleId}-message`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // The element itself is the backdrop hit area; the card inside stops clicks.
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[26rem] max-w-[calc(100vw-2rem)] bg-transparent p-0 text-body
        backdrop:bg-[var(--overlay)]"
    >
      <div className="card p-5 shadow-xl">
        <div className="flex items-start gap-3">
          {destructive ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bad-soft">
              <AlertTriangle className="size-4.5 text-bad" aria-hidden="true" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-semibold" id={titleId}>
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-dim break-anywhere" id={messageId}>
              {message}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <Spinner label="Working" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
