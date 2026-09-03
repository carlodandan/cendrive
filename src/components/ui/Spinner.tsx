import { Loader2 } from "lucide-react";

/**
 * `label` is announced rather than shown; pass `caption` when the wait deserves
 * visible text as well.
 */
export function Spinner({
  label = "Loading",
  className = "size-4",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <>
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );
}

export function LoadingBlock({ caption }: { caption: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <Loader2 className="size-6 animate-spin text-accent" aria-hidden="true" />
      <p className="text-sm text-dim">{caption}</p>
    </div>
  );
}
