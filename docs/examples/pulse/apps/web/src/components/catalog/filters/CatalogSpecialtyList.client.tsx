"use client";

import {
  isSpecializationSlug,
  type SpecializationSlug,
} from "@pulse/domain";

import type { CatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { cn } from "@/lib/utils";

import type { CatalogFilterDraft } from "./CatalogFilterFields.client";

export type CatalogSpecialtyListProps = {
  draft: Pick<CatalogFilterDraft, "specializations">;
  options: CatalogFilterOptions;
  onDraftChange: (patch: Partial<CatalogFilterDraft>) => void;
};

export function CatalogSpecialtyList({  draft,
  options,
  onDraftChange,
}: CatalogSpecialtyListProps) {
  const messages = useMessages();

  const isAllActive = draft.specializations.length === 0;

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-pressed={isAllActive}
        onClick={() => onDraftChange({ specializations: [] })}
        className={cn(
          "h-9 w-full rounded-lg px-3 text-left text-[13px] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
          isAllActive
            ? "bg-primary-container font-medium text-on-primary-container"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        {messages.catalog.specialtyAll}
      </button>
      {options.specializations.map((item) => {
        if (!isSpecializationSlug(item.slug)) {
          return null;
        }

        const slug = item.slug;
        const selected = draft.specializations.includes(slug);

        return (
          <button
            key={slug}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              const next: SpecializationSlug[] = selected
                ? draft.specializations.filter((value) => value !== slug)
                : [...draft.specializations, slug];
              onDraftChange({ specializations: next });
            }}
            className={cn(
              "h-9 w-full rounded-lg px-3 text-left text-[13px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
              selected
                ? "bg-primary-container font-medium text-on-primary-container"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
