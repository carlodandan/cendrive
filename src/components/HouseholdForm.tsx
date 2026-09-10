import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Phone, Plus, Save, Trash2, User, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { useRegionData } from "../hooks/useRegionData";
import {
  EMPTY_HOUSEHOLD,
  EXTENSIONS,
  MAX_FAMILY_MEMBERS,
  RELATIONSHIPS,
} from "../lib/constants";
import { capitalize } from "../lib/format";
import type { HouseholdDetail, HouseholdInput, RecordInput } from "../lib/types";
import { REGIONS } from "../utils/regionsData";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { SelectField, TextField } from "./ui/Field";
import { Spinner } from "./ui/Spinner";

/** Age stays a string while editing so a half-typed value is not coerced to 0. */
export interface MemberDraft {
  key: number;
  firstName: string;
  lastName: string;
  relationship: string;
  age: string;
}

export interface HouseholdFormValue {
  /** `region` holds the display name, which is what the database stores. */
  household: HouseholdInput;
  regionSlug: string;
  members: MemberDraft[];
}

let nextKey = 1;

function draft(): MemberDraft {
  return { key: nextKey++, firstName: "", lastName: "", relationship: "", age: "" };
}

export function emptyFormValue(defaultRegionSlug?: string | null): HouseholdFormValue {
  const region = defaultRegionSlug
    ? REGIONS.find((entry) => entry.slug === defaultRegionSlug)
    : undefined;

  return {
    household: { ...EMPTY_HOUSEHOLD, region: region?.name ?? "" },
    regionSlug: region?.slug ?? "",
    members: [],
  };
}

export function formValueFromDetail(detail: HouseholdDetail): HouseholdFormValue {
  return {
    household: {
      firstName: detail.firstName,
      middleName: detail.middleName ?? "",
      lastName: detail.lastName,
      extension: detail.extension ?? "",
      houseNo: detail.houseNo ?? "",
      streetName: detail.streetName ?? "",
      barangay: detail.barangay ?? "",
      town: detail.town ?? "",
      province: detail.province ?? "",
      region: detail.region ?? "",
      zipCode: detail.zipCode ?? "",
      contactNumber: detail.contactNumber ?? "",
      emailAddress: detail.emailAddress ?? "",
    },
    regionSlug: REGIONS.find((entry) => entry.name === detail.region)?.slug ?? "",
    members: detail.familyMembers.map((member) => ({
      key: nextKey++,
      firstName: member.firstName,
      lastName: member.lastName,
      relationship: member.relationship,
      age: member.age === null ? "" : String(member.age),
    })),
  };
}

/** Blank rows are dropped; the backend skips them too. */
function toRecord(value: HouseholdFormValue): RecordInput {
  return {
    household: value.household,
    familyMembers: value.members
      .filter((member) => member.firstName.trim() || member.lastName.trim())
      .map((member) => ({
        firstName: member.firstName.trim(),
        lastName: member.lastName.trim(),
        relationship: member.relationship,
        age: member.age.trim() === "" ? null : Number(member.age),
      })),
  };
}

type Errors = Record<string, string>;

function validate(value: HouseholdFormValue): Errors {
  const errors: Errors = {};
  const household = value.household;

  if (!household.firstName.trim()) errors.firstName = "Enter a first name.";
  if (!household.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!household.region.trim()) errors.region = "Select a region.";
  if (!household.province.trim()) errors.province = "Select a province.";
  if (!household.town.trim()) errors.town = "Select a city or municipality.";
  if (!household.barangay.trim()) errors.barangay = "Select a barangay.";

  for (const member of value.members) {
    const touched =
      member.firstName.trim() || member.lastName.trim() || member.relationship;
    if (!touched) continue;

    if (!member.firstName.trim()) errors[`member-${member.key}-firstName`] = "Required.";
    if (!member.lastName.trim()) errors[`member-${member.key}-lastName`] = "Required.";
    if (!member.relationship) errors[`member-${member.key}-relationship`] = "Required.";

    const age = member.age.trim();
    if (age !== "" && !/^\d{1,3}$/.test(age)) {
      errors[`member-${member.key}-age`] = "0–120.";
    } else if (age !== "" && Number(age) > 120) {
      errors[`member-${member.key}-age`] = "0–120.";
    }
  }

  return errors;
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-accent" aria-hidden="true" />
          {title}
        </h2>
        {hint ? <div className="text-xs text-faint">{hint}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function HouseholdForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
  secondaryAction,
}: {
  initial: HouseholdFormValue;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (record: RecordInput) => void;
  onCancel: () => void;
  secondaryAction?: ReactNode;
}) {
  const [value, setValue] = useState<HouseholdFormValue>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    regions,
    provinces,
    autoProvince,
    loading: regionLoading,
    error: regionError,
    selectRegion,
    localitiesFor,
    zipCodeFor,
    barangaysFor,
  } = useRegionData();

  // An existing record already has a region, so its lists load on open.
  useEffect(() => {
    if (initial.regionSlug) void selectRegion(initial.regionSlug);
  }, [initial.regionSlug, selectRegion]);

  const localities = useMemo(
    () => localitiesFor(value.household.province),
    [localitiesFor, value.household.province],
  );

  const barangays = useMemo(
    () => barangaysFor(value.household.town),
    [barangaysFor, value.household.town],
  );

  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(initial),
    [value, initial],
  );

  const patch = (fields: Partial<HouseholdInput>) => {
    setValue((current) => ({
      ...current,
      household: { ...current.household, ...fields },
    }));
  };

  const clearError = (key: string) => {
    setErrors((current) => {
      if (!(key in current)) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  };

  const field = (key: keyof HouseholdInput) => ({
    name: key,
    value: value.household[key],
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      patch({ [key]: event.target.value } as Partial<HouseholdInput>);
      clearError(key);
    },
    ...(errors[key] ? { error: errors[key] } : {}),
  });

  const handleRegion = async (slug: string) => {
    const region = REGIONS.find((entry) => entry.slug === slug);
    setValue((current) => ({
      ...current,
      regionSlug: slug,
      household: {
        ...current.household,
        region: region?.name ?? "",
        province: "",
        town: "",
        barangay: "",
        zipCode: "",
      },
    }));
    clearError("region");

    const data = await selectRegion(slug);
    // City-based regions carry a single stand-in province: fill it in for the user.
    if (data?.kind === "city-municipality-based") {
      const province = data.provinces[0]?.name ?? "";
      setValue((current) =>
        current.regionSlug === slug
          ? { ...current, household: { ...current.household, province } }
          : current,
      );
    }
  };

  const handleProvince = (province: string) => {
    patch({ province, town: "", barangay: "", zipCode: "" });
    clearError("province");
  };

  const handleTown = (town: string) => {
    patch({ town, barangay: "", zipCode: zipCodeFor(value.household.province, town) });
    clearError("town");
  };

  const updateMember = (key: number, fields: Partial<Omit<MemberDraft, "key">>) => {
    setValue((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.key === key ? { ...member, ...fields } : member,
      ),
    }));
    for (const name of Object.keys(fields)) clearError(`member-${key}-${name}`);
  };

  const addMember = () => {
    setValue((current) =>
      current.members.length >= MAX_FAMILY_MEMBERS
        ? current
        : { ...current, members: [...current.members, draft()] },
    );
  };

  const removeMember = (key: number) => {
    setValue((current) => ({
      ...current,
      members: current.members.filter((member) => member.key !== key),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(value);
    setErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    onSubmit(toRecord(value));
  };

  const requestCancel = () => {
    if (dirty) setConfirmDiscard(true);
    else onCancel();
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Section icon={User} title="Household head" hint="Name is required">
          <div className="grid grid-cols-4 gap-4">
            <TextField label="First name" required autoComplete="off" {...field("firstName")} />
            <TextField label="Middle name" autoComplete="off" {...field("middleName")} />
            <TextField label="Last name" required autoComplete="off" {...field("lastName")} />
            <SelectField label="Extension" {...field("extension")}>
              <option value="">None</option>
              {EXTENSIONS.map((extension) => (
                <option key={extension} value={extension}>
                  {extension}
                </option>
              ))}
            </SelectField>
          </div>
        </Section>

        <Section icon={MapPin} title="Address">
          <div className="grid grid-cols-4 gap-4">
            <TextField label="House no." placeholder="e.g. 123" {...field("houseNo")} />
            <TextField
              label="Street"
              placeholder="e.g. Rizal Street"
              className="col-span-2"
              {...field("streetName")}
            />
            <SelectField
              label="Barangay"
              required
              name="barangay"
              value={value.household.barangay}
              disabled={submitting || !value.household.town || barangays.length === 0}
              onChange={(event) => {
                patch({ barangay: event.target.value });
                clearError("barangay");
              }}
              title={!value.household.town ? "Choose a city or municipality first." : ""}
              {...(errors.barangay ? { error: errors.barangay } : {})}
            >
              <option value="">
                {regionLoading ? "Loading barangays…" : "Select a barangay"}
              </option>
              {barangays.map((bgy) => (
                <option key={bgy} value={bgy}>
                  {bgy}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Region"
              required
              name="region"
              className="col-span-2"
              value={value.regionSlug}
              disabled={submitting}
              onChange={(event) => void handleRegion(event.target.value)}
              {...(errors.region ? { error: errors.region } : {})}
              {...(regionError ? { help: regionError } : {})}
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.slug} value={region.slug}>
                  {region.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Province"
              required
              name="province"
              className="col-span-2"
              value={value.household.province}
              disabled={submitting || !value.regionSlug || Boolean(autoProvince)}
              onChange={(event) => handleProvince(event.target.value)}
              title={!value.regionSlug ? "Choose a region first." : ""}
              {...(errors.province ? { error: errors.province } : {})}
              {...(autoProvince
                ? { help: "This region is organised by city and municipality." }
                : {})}
            >
              <option value="">
                {regionLoading ? "Loading provinces…" : "Select a province"}
              </option>
              {provinces.map((province) => (
                <option key={province.name} value={province.name}>
                  {province.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="City or municipality"
              required
              name="town"
              className="col-span-2"
              value={value.household.town}
              disabled={submitting || !value.household.province || localities.length === 0}
              onChange={(event) => handleTown(event.target.value)}
              title={!value.household.province ? "Choose a province first." : ""}
              {...(errors.town ? { error: errors.town } : {})}
            >
              <option value="">
                {regionLoading ? "Loading localities…" : "Select a city or municipality"}
              </option>
              {localities.map((locality) => (
                <option key={locality.name} value={locality.name}>
                  {locality.name}
                  {locality.kind === "city" ? " (City)" : ""}
                </option>
              ))}
            </SelectField>

            <TextField
              label="ZIP code"
              name="zipCode"
              className="col-span-2"
              value={value.household.zipCode}
              readOnly
              onChange={() => undefined}
              help={
                value.household.town && !value.household.zipCode
                  ? "No ZIP code is published for this locality."
                  : "Filled in from the selected city or municipality."
              }
            />
          </div>
        </Section>

        <Section icon={Phone} title="Contact">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Contact number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. +63 912 345 6789"
              {...field("contactNumber")}
            />
            <TextField
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. name@example.com"
              {...field("emailAddress")}
            />
          </div>
        </Section>

        <Section
          icon={Users}
          title="Family members"
          hint={`${value.members.length} of ${MAX_FAMILY_MEMBERS}`}
        >
          {value.members.length > 0 ? (
            <div className="space-y-2">
              <div
                aria-hidden="true"
                className="grid grid-cols-[1fr_1fr_11rem_5rem_2.25rem] gap-2 px-0.5 text-xs
                  font-medium text-dim"
              >
                <span>First name</span>
                <span>Last name</span>
                <span>Relationship</span>
                <span>Age</span>
                <span />
              </div>

              <ul className="space-y-2">
                {value.members.map((member, index) => (
                  <li
                    key={member.key}
                    className="grid grid-cols-[1fr_1fr_11rem_5rem_2.25rem] items-start gap-2"
                  >
                    <MemberCell error={errors[`member-${member.key}-firstName`]}>
                      <input
                        name={`member-${member.key}-firstName`}
                        aria-label={`First name, member ${index + 1}`}
                        className={`input${
                          errors[`member-${member.key}-firstName`] ? " input-invalid" : ""
                        }`}
                        value={member.firstName}
                        disabled={submitting}
                        onChange={(event) =>
                          updateMember(member.key, { firstName: event.target.value })
                        }
                      />
                    </MemberCell>

                    <MemberCell error={errors[`member-${member.key}-lastName`]}>
                      <input
                        name={`member-${member.key}-lastName`}
                        aria-label={`Last name, member ${index + 1}`}
                        className={`input${
                          errors[`member-${member.key}-lastName`] ? " input-invalid" : ""
                        }`}
                        value={member.lastName}
                        disabled={submitting}
                        onChange={(event) =>
                          updateMember(member.key, { lastName: event.target.value })
                        }
                      />
                    </MemberCell>

                    <MemberCell error={errors[`member-${member.key}-relationship`]}>
                      <select
                        name={`member-${member.key}-relationship`}
                        aria-label={`Relationship, member ${index + 1}`}
                        className={`input pr-8${
                          errors[`member-${member.key}-relationship`] ? " input-invalid" : ""
                        }`}
                        value={member.relationship}
                        disabled={submitting}
                        onChange={(event) =>
                          updateMember(member.key, { relationship: event.target.value })
                        }
                      >
                        <option value="">Select…</option>
                        {RELATIONSHIPS.map((relationship) => (
                          <option key={relationship} value={relationship}>
                            {capitalize(relationship)}
                          </option>
                        ))}
                      </select>
                    </MemberCell>

                    <MemberCell error={errors[`member-${member.key}-age`]}>
                      <input
                        name={`member-${member.key}-age`}
                        aria-label={`Age, member ${index + 1}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={120}
                        className={`input tabular-nums${
                          errors[`member-${member.key}-age`] ? " input-invalid" : ""
                        }`}
                        value={member.age}
                        disabled={submitting}
                        onChange={(event) =>
                          updateMember(member.key, { age: event.target.value })
                        }
                      />
                    </MemberCell>

                    <button
                      type="button"
                      className="btn btn-ghost btn-icon text-faint hover:text-bad"
                      onClick={() => removeMember(member.key)}
                      disabled={submitting}
                      aria-label={`Remove member ${index + 1}`}
                      title="Remove"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-dim">
              No family members recorded yet. The household head is stored separately.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addMember}
              disabled={submitting || value.members.length >= MAX_FAMILY_MEMBERS}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add member
            </button>
            {value.members.length >= MAX_FAMILY_MEMBERS ? (
              <p className="text-xs text-faint">
                {MAX_FAMILY_MEMBERS} members is the limit for one household.
              </p>
            ) : null}
          </div>
        </Section>

        <div className="flex items-center justify-end gap-2 pb-2">
          {secondaryAction}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={requestCancel}
            disabled={submitting}
          >
            <X className="size-4" aria-hidden="true" />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <Spinner label="Saving" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        message="This form has unsaved changes. Leaving now discards them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}

/**
 * One grid cell of a member row: the control plus room for its error, so a
 * message appearing never shifts the neighbouring columns.
 */
function MemberCell({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      {children}
      {error ? <p className="mt-1 text-xs text-bad">{error}</p> : null}
    </div>
  );
}
