import type { HouseholdInput } from "./types";

/** Relationship options, in the order the Data Entry select shows them. */
export const RELATIONSHIPS = [
  "father",
  "mother",
  "son",
  "daughter",
  "sibling",
  "grandfather",
  "grandmother",
  "uncle",
  "aunt",
  "cousin",
  "spouse",
  "other",
] as const;

export type Relationship = (typeof RELATIONSHIPS)[number];

/** Name suffixes. "None" is represented by the empty option, stored as NULL. */
export const EXTENSIONS = ["Jr.", "Sr.", "II", "III", "IV"] as const;

/** Same precedence the backend uses when ordering a household's members. */
export const RELATIONSHIP_RANK: Record<string, number> = {
  father: 1,
  mother: 2,
  son: 3,
  daughter: 4,
};

export function relationshipRank(relationship: string): number {
  return RELATIONSHIP_RANK[relationship] ?? 5;
}

export const EMPTY_HOUSEHOLD: HouseholdInput = {
  firstName: "",
  middleName: "",
  lastName: "",
  extension: "",
  houseNo: "",
  streetName: "",
  barangay: "",
  town: "",
  province: "",
  region: "",
  zipCode: "",
  contactNumber: "",
  emailAddress: "",
};

export const MAX_FAMILY_MEMBERS = 30;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const REPOSITORY_URL = "https://github.com/carlodandan/cendrive";
