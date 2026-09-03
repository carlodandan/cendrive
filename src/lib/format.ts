/**
 * SQLite writes `CURRENT_TIMESTAMP` as UTC in `YYYY-MM-DD HH:MM:SS` form, with
 * no zone marker. `new Date(value)` treats that as local time, which shifted
 * every timestamp by the UTC offset in the Electron build — eight hours in the
 * Philippines. Normalising to an ISO instant first fixes that.
 */
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const isoish = value.includes("T") ? value : value.replace(" ", "T");
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(isoish);
  const date = new Date(hasZone ? isoish : `${isoish}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat();

export const EM_DASH = "—";

export function formatDate(value: string | null | undefined): string {
  const date = parseTimestamp(value);
  return date ? dateFormatter.format(date) : EM_DASH;
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseTimestamp(value);
  return date ? dateTimeFormatter.format(date) : EM_DASH;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

interface NameParts {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  extension?: string | null;
}

export function displayName(person: NameParts): string {
  const name = [person.firstName, person.middleName, person.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const extension = person.extension?.trim();
  return extension ? `${name} ${extension}` : name;
}

export function initials(person: NameParts): string {
  const first = person.firstName.trim().charAt(0);
  const last = person.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

export function addressLine(parts: {
  houseNo?: string | null;
  streetName?: string | null;
  barangay?: string | null;
  town?: string | null;
  province?: string | null;
  zipCode?: string | null;
}): string {
  const street = [parts.houseNo, parts.streetName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const segments = [street, parts.barangay, parts.town, parts.province, parts.zipCode]
    .map((part) => part?.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments.join(", ") : EM_DASH;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Quotes a CSV field and neutralises leading characters that spreadsheets treat
 * as the start of a formula, so exported record data can never be executed.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(",");
}
