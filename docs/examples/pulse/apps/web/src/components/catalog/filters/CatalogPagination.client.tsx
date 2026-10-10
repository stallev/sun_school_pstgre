"use client";

import type { CatalogTrainersQuery } from "@pulse/domain";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { buildCatalogHref } from "@/lib/catalog/build-catalog-search-params";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export type CatalogPaginationProps = {
  query: CatalogTrainersQuery;
  page: number;
  totalPages: number;
};

export function CatalogPagination({  query,
  page,
  totalPages,
}: CatalogPaginationProps) {
  const messages = useMessages();

  if (totalPages <= 1) {
    return null;
  }

  const previousHref =
    page > 1 ? buildCatalogHref(query, { page: page - 1 }) : undefined;
  const nextHref =
    page < totalPages ? buildCatalogHref(query, { page: page + 1 }) : undefined;

  return (
    <Pagination aria-label={messages.catalog.pagination.pageLabel
      .replace("{page}", String(page))
      .replace("{total}", String(totalPages))}
    >
      <PaginationContent>
        <PaginationItem>
          {previousHref ? (
            <PaginationPrevious href={previousHref} text={messages.catalog.pagination.previous} />
          ) : (
            <PaginationPrevious
              href="#"
              aria-disabled
              className="pointer-events-none opacity-50"
              text={messages.catalog.pagination.previous}
            />
          )}
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={buildCatalogHref(query, { page })} isActive>
            {page}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          {nextHref ? (
            <PaginationNext href={nextHref} text={messages.catalog.pagination.next} />
          ) : (
            <PaginationNext
              href="#"
              aria-disabled
              className="pointer-events-none opacity-50"
              text={messages.catalog.pagination.next}
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
