import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

interface Wiring {
  id: string;
  invalid: boolean;
  describedBy: string | undefined;
}

interface FieldProps {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  /** Receives the ids to spread onto the control so the label and messages link up. */
  children: (wiring: Wiring) => ReactNode;
}

/**
 * Every control gets a visible label, and help or error text is wired through
 * `aria-describedby` rather than left as unassociated paragraphs.
 */
export function Field({
  label,
  required = false,
  help,
  error,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
        {required ? (
          <span className="text-bad" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {children({ id, invalid: Boolean(error), describedBy })}
      {error ? (
        <p className="error-text" id={errorId}>
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {help ? (
        <p className="help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> &
  Pick<FieldProps, "label" | "help" | "error" | "className"> & {
    /** Renders a textarea while keeping the same label and message wiring. */
    multiline?: boolean;
    rows?: number;
  };

export function TextField({
  label,
  help,
  error,
  className,
  multiline = false,
  required,
  ...control
}: TextFieldProps) {
  const textareaProps = control as TextareaHTMLAttributes<HTMLTextAreaElement>;

  return (
    <Field
      label={label}
      {...(required ? { required: true } : {})}
      {...(help ? { help } : {})}
      {...(error ? { error } : {})}
      {...(className ? { className } : {})}
    >
      {({ id, invalid, describedBy }) =>
        multiline ? (
          <textarea
            {...textareaProps}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`input${invalid ? " input-invalid" : ""}`}
          />
        ) : (
          <input
            {...control}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`input${invalid ? " input-invalid" : ""}`}
          />
        )
      }
    </Field>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> &
  Pick<FieldProps, "label" | "help" | "error" | "className">;

export function SelectField({
  label,
  help,
  error,
  className,
  required,
  children,
  ...control
}: SelectFieldProps) {
  return (
    <Field
      label={label}
      {...(required ? { required: true } : {})}
      {...(help ? { help } : {})}
      {...(error ? { error } : {})}
      {...(className ? { className } : {})}
    >
      {({ id, invalid, describedBy }) => (
        <select
          {...control}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`input${invalid ? " input-invalid" : ""} pr-8`}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
