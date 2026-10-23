import type { AdultRelation } from "../constants/enums";

export type FamilyAdultContactRow = {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  relation: AdultRelation;
  phones: unknown;
  email: string | null;
};

/** AZ-63 / СМ-8 — teacher-facing contact (no email). */
export type TeacherFamilyAdultContact = {
  adultId: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  relation: AdultRelation;
  phones: string[];
};

export const mapAdultToTeacherFamilyContact = (row: FamilyAdultContactRow): TeacherFamilyAdultContact => ({
  adultId: row.id,
  lastName: row.lastName,
  firstName: row.firstName,
  middleName: row.middleName,
  relation: row.relation,
  phones: normalizePhones(row.phones),
});

const phoneFromEntry = (entry: unknown): string | null => {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (entry && typeof entry === "object" && "number" in entry) {
    const number = (entry as { number?: unknown }).number;
    if (typeof number === "string") {
      const trimmed = number.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
};

const normalizePhones = (phones: unknown): string[] => {
  if (!Array.isArray(phones)) return [];
  return phones.map(phoneFromEntry).filter((entry): entry is string => entry !== null);
};
