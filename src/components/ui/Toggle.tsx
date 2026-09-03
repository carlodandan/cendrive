import { useId } from "react";

/**
 * A real checkbox with `role="switch"`, so keyboard, screen reader and
 * form semantics come from the platform; only the track and knob are drawn.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label className="text-sm font-medium text-body" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-dim" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className="h-5 w-9 rounded-full border border-line-strong bg-surface-2 transition-colors
            peer-checked:border-accent peer-checked:bg-accent
            peer-disabled:cursor-not-allowed peer-disabled:opacity-50
            peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 size-4 rounded-full bg-canvas shadow transition-transform
            peer-checked:translate-x-4"
        />
      </label>
    </div>
  );
}
