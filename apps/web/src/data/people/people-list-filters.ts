export const PEOPLE_LIST_FILTER = {
  ALL: "all",
  UNASSIGNED: "unassigned",
  INACTIVE: "inactive",
  LEGACY: "legacy",
} as const;

export type PeopleListFilter =
  (typeof PEOPLE_LIST_FILTER)[keyof typeof PEOPLE_LIST_FILTER];
