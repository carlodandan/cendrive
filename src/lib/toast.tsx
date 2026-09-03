import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  detail?: string;
}

interface ToastApi {
  success: (message: string, detail?: string) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string, detail?: string) => void;
  warning: (message: string, detail?: string) => void;
  dismiss: (id: number) => void;
}

/** Within the 3–5s guidance; problems linger a little longer than confirmations. */
const DISMISS_AFTER: Record<ToastKind, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 5000,
};

const MAX_VISIBLE = 4;

const KIND_STYLE: Record<ToastKind, { border: string; icon: string }> = {
  success: { border: "border-l-ok", icon: "text-ok" },
  error: { border: "border-l-bad", icon: "text-bad" },
  warning: { border: "border-l-warn", icon: "text-warn" },
  info: { border: "border-l-info", icon: "text-info" },
};

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), DISMISS_AFTER[toast.kind]);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.kind, onDismiss]);

  const Icon = ICONS[toast.kind];
  const style = KIND_STYLE[toast.kind];

  return (
    <div
      className={`card toast-item pointer-events-auto flex items-start gap-2.5 border-l-4 p-3 shadow-lg ${style.border}`}
      {...(toast.kind === "error" ? { role: "alert" } : {})}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${style.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-body">{toast.message}</p>
        {toast.detail ? (
          <p className="mt-0.5 text-xs text-dim break-anywhere">{toast.detail}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="btn btn-ghost -mr-1 -mt-1 size-7 shrink-0 px-0"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string, detail?: string) => {
    setToasts((current) => {
      const toast: Toast = { id: nextId++, kind, message, ...(detail ? { detail } : {}) };
      return [...current, toast].slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, detail) => push("success", message, detail),
      error: (message, detail) => push("error", message, detail),
      info: (message, detail) => push("info", message, detail),
      warning: (message, detail) => push("warning", message, detail),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* One polite live region for the stack; errors escalate per item. */}
      <div
        className="pointer-events-none fixed right-4 bottom-14 z-50 flex w-80 flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return context;
}
