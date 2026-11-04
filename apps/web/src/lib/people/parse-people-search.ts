import { z } from "zod";

export const PEOPLE_SEARCH_MIN_LENGTH = 2;
export const PEOPLE_SEARCH_MAX_LENGTH = 80;

/** Strip control chars; keep user text literal for PostgreSQL `contains`. */
export const sanitizePeopleSearchTerm = (value: string): string =>
  value.split("\u0000").join("").replace(/\s+/g, " ").trim();

const peopleSearchRawSchema = z
  .string()
  .trim()
  .max(PEOPLE_SEARCH_MAX_LENGTH)
  .transform(sanitizePeopleSearchTerm);

export type ParsedPeopleSearch = {
  /** Normalized term for Prisma `contains` when length ≥ min; otherwise undefined. */
  searchTerm: string | undefined;
  /** Trimmed value from the URL (may be shorter than min). */
  displayQuery: string;
};

export const parsePeopleSearchParam = (raw: string | undefined | null): ParsedPeopleSearch => {
  const displayQuery = (raw ?? "").trim();
  if (displayQuery.length < PEOPLE_SEARCH_MIN_LENGTH) {
    return { searchTerm: undefined, displayQuery };
  }
  const parsed = peopleSearchRawSchema.safeParse(displayQuery);
  if (!parsed.success) {
    return { searchTerm: undefined, displayQuery: "" };
  }
  return { searchTerm: parsed.data, displayQuery };
};

export const appendPeopleSearchToHref = (href: string, query: string | undefined): string => {
  const trimmed = (query ?? "").trim();
  if (trimmed.length < PEOPLE_SEARCH_MIN_LENGTH) return href;
  const url = new URL(href, "http://local");
  url.searchParams.set("q", trimmed);
  const path = url.pathname;
  const search = url.searchParams.toString();
  return search ? `${path}?${search}` : path;
};
