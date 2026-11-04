"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { AlertText, ContentText } from "@/components/atoms";
import { EmptyState } from "@/components/patterns/EmptyState";
import { CustomLink } from "@/components/ui/custom-link";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { normalizeVerseText } from "@/data/bible/normalize-verse-text";
import {
  compareVersesCatalogByBible,
  compareVersesCatalogByLessons,
  type VersesCatalogSortRow,
} from "@/lib/bible/sort-verses-catalog-rows";

export type VersesCatalogViewRow = VersesCatalogSortRow & {
  refLabel: string;
  text: string | null;
  hasMissing: boolean;
  usages: { lessonId: string; ordinal: number; linkLabel: string }[];
};

type VersesCatalogSortMode = "bible" | "lessons";

type VersesCatalogMessages = {
  searchLabel: string;
  searchPlaceholder: string;
  searchEmpty: string;
  verseMissing: string;
  lessonsPrefix: string;
  sortLabel: string;
  sortByBible: string;
  sortByLessons: string;
  notUsed: string;
  emptyTitle: string;
  emptyDescription: string;
  versesOrderHint: { term: string; hint: string };
  termHintAriaLabel: string;
};

type VersesCatalogProps = {
  rows: VersesCatalogViewRow[];
  messages: VersesCatalogMessages;
};

export const VersesCatalog = ({ rows, messages }: VersesCatalogProps) => {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<VersesCatalogSortMode>("bible");
  const normalizedQuery = query.trim().toLowerCase();

  const sortedRows = useMemo(() => {
    const compare =
      sortMode === "lessons" ? compareVersesCatalogByLessons : compareVersesCatalogByBible;
    return [...rows].sort(compare);
  }, [rows, sortMode]);

  const filteredRows = useMemo(() => {
    if (!normalizedQuery) return sortedRows;
    return sortedRows.filter(
      (row) =>
        row.refLabel.toLowerCase().includes(normalizedQuery) ||
        (row.text?.toLowerCase().includes(normalizedQuery) ?? false),
    );
  }, [normalizedQuery, sortedRows]);

  if (rows.length === 0) {
    return <EmptyState title={messages.emptyTitle} description={messages.emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <TermLabel
        term={nonEmptyTerm(messages.versesOrderHint.term)}
        hint={messages.versesOrderHint.hint}
        ariaLabel={messages.termHintAriaLabel}
        className="text-sm"
      />
      <SegmentedControl
        aria-label={messages.sortLabel}
        value={sortMode}
        onValueChange={setSortMode}
        options={[
          { value: "bible", label: messages.sortByBible },
          { value: "lessons", label: messages.sortByLessons },
        ]}
      />
      <div className="relative max-w-xl">
        <SearchIcon
          className="pointer-events-none absolute top-3 left-3 size-4 text-muted"
          aria-hidden
        />
        <label className="sr-only" htmlFor="verses-search">{messages.searchLabel}</label>
        <Input
          id="verses-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={messages.searchPlaceholder}
          className="pl-10"
        />
      </div>
      {filteredRows.length === 0 ? (
        <ContentText className="text-sm text-muted">{messages.searchEmpty}</ContentText>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {filteredRows.map((row) => (
            <li
              key={`${row.bookId}:${row.startChapter}:${row.startVerse}`}
              className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[8rem_minmax(0,1fr)_12rem] md:gap-6"
            >
              <ContentText>{row.refLabel}</ContentText>
              {row.hasMissing ? (
                <AlertText>{messages.verseMissing}</AlertText>
              ) : (
                <ContentText className="font-display text-[1.0625rem] leading-relaxed italic text-ink-2 whitespace-pre-wrap">
                  {row.text ? normalizeVerseText(row.text) : null}
                </ContentText>
              )}
              <ContentText className="text-sm text-muted md:text-right">
                {row.usages.length === 0 ? (
                  messages.notUsed
                ) : (
                  <>
                    {messages.lessonsPrefix}{" "}
                    {row.usages.map((usage, index) => (
                      <span key={`${row.refLabel}-${usage.lessonId}`}>
                        {index > 0 ? ", " : null}
                        <CustomLink
                          href={`/lessons/${usage.lessonId}`}
                          className="text-ink underline-offset-2 hover:text-cobalt-ink focus-visible:text-cobalt-ink"
                        >
                          {usage.linkLabel}
                        </CustomLink>
                      </span>
                    ))}
                  </>
                )}
              </ContentText>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
