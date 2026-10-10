"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { CatalogTrainersQuery } from "@pulse/domain";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { buildCatalogHref } from "@/lib/catalog/build-catalog-search-params";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { cn } from "@/lib/utils";

export type CatalogSearchInputProps = {
  query: CatalogTrainersQuery;
  className?: string;
};

export function CatalogSearchInput({ query, className }: CatalogSearchInputProps) {
  const messages = useMessages();
  const router = useRouter();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? query.q;

  useEffect(() => {
    if (draft === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (draft.trim() === query.q.trim()) {
        setDraft(null);
        return;
      }

      router.push(buildCatalogHref(query, { q: draft.trim(), page: 1 }));
      setDraft(null);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [draft, query, router]);

  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        size="search"
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={messages.catalog.searchPlaceholder}
        aria-label={messages.catalog.searchPlaceholder}
        className="w-full"
      />
    </div>
  );
}
