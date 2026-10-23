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

const normalizePhones = (phones: unknown): string[] => {
  if (!Array.isArray(phones)) return [];
  return phones.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
};
