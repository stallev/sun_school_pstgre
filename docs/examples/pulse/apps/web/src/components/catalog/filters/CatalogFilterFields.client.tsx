"use client";

import {
  CATALOG_MIN_RATINGS,
  type CatalogMinRating,
} from "@pulse/domain";

import { ContentText } from "@/components/atoms";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import type { CatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


import type { CatalogFilterDraft } from "@/lib/catalog/catalog-filter-draft";

import { CatalogSpecialtyList } from "./CatalogSpecialtyList.client";

export type { CatalogFilterDraft };

export type CatalogFilterFieldsProps = {
  draft: CatalogFilterDraft;
  options: CatalogFilterOptions;
  onDraftChange: (patch: Partial<CatalogFilterDraft>) => void;
};

function getMaxPriceDollars(
  maxPriceCents: number | undefined,
  ceilingCents: number,
): number {
  if (maxPriceCents !== undefined) {
    return Math.round(maxPriceCents / 100);
  }

  return Math.round(ceilingCents / 100);
}

export function CatalogFilterFields({  draft,
  options,
  onDraftChange,
}: CatalogFilterFieldsProps) {
  const messages = useMessages();

  const isMaxPriceFiltered = draft.maxPriceCents !== undefined;
  const maxPriceDollars = getMaxPriceDollars(
    draft.maxPriceCents,
    options.maxPriceCeilingCents,
  );
  const ceilingDollars = Math.max(1, Math.round(options.maxPriceCeilingCents / 100));
  const maxPriceLabel = isMaxPriceFiltered
    ? `${messages.catalog.maxPriceLabel}: $${maxPriceDollars}`
    : messages.catalog.maxPriceAny;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label
          htmlFor="catalog-max-price"
          className="text-[13px] font-medium text-muted-foreground"
        >
          {maxPriceLabel}
        </Label>
        <Slider
          id="catalog-max-price"
          min={0}
          max={ceilingDollars}
          step={5}
          value={[maxPriceDollars]}
          onValueChange={([value]) => {
            onDraftChange({
              maxPriceCents:
                value >= ceilingDollars ? undefined : Math.max(value, 1) * 100,
            });
          }}
        />
        <div className="flex justify-between">
          <ContentText variant="hint" as="span" className="font-mono">
            $0
          </ContentText>
          <ContentText variant="hint" as="span" className="font-mono">
            ${ceilingDollars}
          </ContentText>
        </div>
      </div>

      <div className="space-y-3">
        <ContentText variant="blockLabel" as="p" className="text-muted-foreground">
          {messages.catalog.ratingLabel}
        </ContentText>
        <RadioGroup
          value={draft.minRating?.toString() ?? "any"}
          onValueChange={(value) => {
            onDraftChange({
              minRating:
                value === "any" ? undefined : (Number(value) as CatalogMinRating),
            });
          }}
          className="grid grid-cols-2 gap-1.5"
        >
          <RadioGroupItem variant="tile" value="any" className="h-9 text-[12px]">
            {messages.catalog.ratingAny}
          </RadioGroupItem>
          {CATALOG_MIN_RATINGS.map((rating) => (
            <RadioGroupItem
              key={rating}
              variant="tile"
              value={String(rating)}
              className="h-9 text-[12px]"
            >
              {messages.catalog.ratingTier.replace("{value}", String(rating))}
            </RadioGroupItem>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <ContentText variant="blockLabel" as="p" className="text-muted-foreground">
          {messages.catalog.specialtyLabel}
        </ContentText>
        <CatalogSpecialtyList
          draft={draft}
          options={options}
          onDraftChange={onDraftChange}
        />
      </div>
    </div>
  );
}
