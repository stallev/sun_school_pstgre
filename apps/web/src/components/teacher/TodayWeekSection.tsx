import { ChevronRightIcon } from "lucide-react";
import { SectionTitle } from "@/components/atoms";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import type { TodayWeekRow } from "@/data/lessons/load-today-week-rows.server";

type TodayWeekSectionProps = {
  title: string;
  rows: TodayWeekRow[];
  className?: string;
};

export const TodayWeekSection = ({ title, rows, className }: TodayWeekSectionProps) => (
  <section className={className}>
    <SectionTitle className="mb-3">{title}</SectionTitle>
    <dl className="divide-y divide-line rounded-xl border border-line bg-surface">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 md:px-5"
        >
          <dt className="w-full shrink-0 text-sm text-muted sm:w-48">{row.label}</dt>
          <dd className="flex flex-1 items-center justify-between gap-3">
            <ContentText className="text-sm text-ink-2">{row.description}</ContentText>
            <CustomLink
              href={row.href}
              aria-label={row.openLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-paper hover:text-ink"
            >
              <ChevronRightIcon className="size-5" aria-hidden />
            </CustomLink>
          </dd>
        </div>
      ))}
    </dl>
  </section>
);
