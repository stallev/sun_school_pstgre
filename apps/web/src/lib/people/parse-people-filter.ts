import { z } from "zod";
import { PEOPLE_LIST_FILTER, type PeopleListFilter } from "@/data/people/people-list-filters";
import { parsePeopleSearchParam } from "@/lib/people/parse-people-search";

export const PEOPLE_PAGE_SIZE = 20;

const filterSchema = z.enum([
  PEOPLE_LIST_FILTER.ALL,
  PEOPLE_LIST_FILTER.UNASSIGNED,
  PEOPLE_LIST_FILTER.INACTIVE,
  PEOPLE_LIST_FILTER.LEGACY,
]);

const groupSchema = z.string().uuid();

const pageSchema = z.coerce.number().int().min(1).max(999);

export type ParsedPeopleListQuery = {
  filter: PeopleListFilter;
  groupId: string | undefined;
  page: number;
  searchTerm: string | undefined;
  displayQuery: string;
};

export const parsePeopleListFilter = (raw: string | undefined): PeopleListFilter => {
  const parsed = filterSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return PEOPLE_LIST_FILTER.ALL;
};

export const parsePeopleListQuery = (params: {
  filter?: string;
  group?: string;
  page?: string;
  q?: string;
}): ParsedPeopleListQuery => {
  const filter = parsePeopleListFilter(params.filter);
  const { searchTerm, displayQuery } = parsePeopleSearchParam(params.q);

  const groupParsed = params.group ? groupSchema.safeParse(params.group) : null;
  const groupId = groupParsed?.success ? groupParsed.data : undefined;

  const pageParsed = params.page ? pageSchema.safeParse(params.page) : null;
  const page = pageParsed?.success ? pageParsed.data : 1;

  return { filter, groupId, page, searchTerm, displayQuery };
};

export const clampPeoplePage = (page: number, totalItems: number): number => {
  if (totalItems <= 0) return 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / PEOPLE_PAGE_SIZE));
  return Math.min(page, totalPages);
};

export const buildPeopleListHref = (options: {
  filter?: PeopleListFilter;
  groupId?: string;
  page?: number;
  displayQuery?: string;
}): string => {
  const filter = options.filter ?? PEOPLE_LIST_FILTER.ALL;
  const params = new URLSearchParams();
  if (filter !== PEOPLE_LIST_FILTER.ALL) {
    params.set("filter", filter);
  }
  if (options.groupId) {
    params.set("group", options.groupId);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  const trimmedQuery = (options.displayQuery ?? "").trim();
  if (trimmedQuery.length >= 2) {
    params.set("q", trimmedQuery);
  }
  const search = params.toString();
  return search ? `/people?${search}` : "/people";
};
