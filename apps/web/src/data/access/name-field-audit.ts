import type { PersonName } from "@sunschool/domain";

type StoredName = {
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
};

const NAME_KEYS = ["lastName", "firstName", "middleName"] as const satisfies readonly (keyof PersonName)[];

/** Field identifiers for audit `old_value` / `new_value` without storing ФИО (INV-23). */
export const listChangedNameFields = (before: StoredName, after: PersonName): readonly string[] => {
  const changed: string[] = [];
  for (const key of NAME_KEYS) {
    const prev = before[key] ?? null;
    const next = after[key] ?? null;
    if (prev !== next) changed.push(key);
  }
  return changed;
};

export const nameAuditPayload = (changedFields: readonly string[]) =>
  changedFields.length > 0 ? { changedFields: [...changedFields] } : null;
