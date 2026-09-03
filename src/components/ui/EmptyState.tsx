import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Empty states say what is missing and offer the next step, instead of leaving a
 * blank panel.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-2">
        <Icon className="size-6 text-faint" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-dim">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
