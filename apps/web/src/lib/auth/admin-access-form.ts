import type { UserRole } from "@sunschool/domain";
import { USER_ROLE } from "@sunschool/domain";

const ROLE_VALUES: ReadonlySet<string> = new Set([USER_ROLE.ADMIN, USER_ROLE.TEACHER]);

export const rolesFromForm = (formData: FormData): UserRole[] => {
  const raw = formData.getAll("roles").flatMap((value) => String(value).split(","));
  const roles: UserRole[] = [];
  for (const entry of raw) {
    const trimmed = entry.trim();
    if (ROLE_VALUES.has(trimmed)) roles.push(trimmed as UserRole);
  }
  return [...new Set(roles)];
};

export const gradeIdsFromForm = (formData: FormData): string[] => {
  const raw = formData.getAll("gradeIds").flatMap((value) => String(value).split(","));
  return [...new Set(raw.map((entry) => entry.trim()).filter((entry) => entry.length > 0))];
};

export const uuidFromForm = (formData: FormData, key: string): string => String(formData.get(key) ?? "").trim();
