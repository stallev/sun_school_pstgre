"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { CatalogTrainersQuery } from "@pulse/domain";

import { buildCatalogHref } from "@/lib/catalog/build-catalog-search-params";
import {
  pickCatalogFilterDraft,
  type CatalogFilterDraft,
} from "@/lib/catalog/catalog-filter-draft";

const PRICE_FILTER_DEBOUNCE_MS = 350;

export function useCatalogSidebarFilterDraft(query: CatalogTrainersQuery) {
  const router = useRouter();
  const queryRef = useRef(query);
  const draftRef = useRef(pickCatalogFilterDraft(query));
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState<CatalogFilterDraft>(() =>
    pickCatalogFilterDraft(query),
  );

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(
    () => () => {
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    },
    [],
  );

  const flushPriceDebounce = () => {
    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
      priceDebounceRef.current = null;
    }
  };

  const pushDraft = (next: CatalogFilterDraft) => {
    router.push(buildCatalogHref(queryRef.current, { ...next, page: 1 }));
  };

  const handleDraftChange = (patch: Partial<CatalogFilterDraft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);

    if ("maxPriceCents" in patch) {
      flushPriceDebounce();
      priceDebounceRef.current = setTimeout(() => {
        pushDraft(draftRef.current);
        priceDebounceRef.current = null;
      }, PRICE_FILTER_DEBOUNCE_MS);
      return;
    }

    flushPriceDebounce();
    pushDraft(next);
  };

  const handleClear = () => {
    flushPriceDebounce();
    router.push(
      buildCatalogHref(queryRef.current, {
        maxPriceCents: undefined,
        minRating: undefined,
        specializations: [],
        q: "",
        page: 1,
      }),
    );
  };

  return { draft, handleDraftChange, handleClear };
}
