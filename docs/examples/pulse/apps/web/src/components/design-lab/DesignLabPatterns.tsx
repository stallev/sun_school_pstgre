import { CalendarIcon, StarIcon, UsersIcon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import { RatingStars } from "@/components/ui/RatingStars";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import {
  DesignLabSection,
} from "@/components/design-lab/DesignLabSection";
import { getPrototypeRef } from "@/lib/design-lab/prototype-refs";

function PatternBlock({
  patternId,
  title,
  children,
}: {
  patternId: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = getPrototypeRef(patternId);
  return (
    <div className="space-y-3 rounded-[var(--card-radius-lg)] border border-border bg-card p-4">
      <div>
        <Heading as="h3" visualLevel="h5">
          {title}
        </Heading>
        {ref ? (
          <ContentText variant="mutedMicro" as="p">
            Prototype:{" "}
            <span className="font-mono">{ref.screenId}</span>
          </ContentText>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function DesignLabPatterns() {
  return (
    <DesignLabSection id="patterns" title="L3 — Patterns">
      <div className="space-y-6">
        <PatternBlock patternId="pattern-cta" title="Primary CTA row">
          <div className="flex flex-wrap gap-3">
            <Button>Confirm booking</Button>
            <Button variant="outline">Back</Button>
          </div>
        </PatternBlock>

        <PatternBlock patternId="pattern-kpi" title="KPI 4-up grid">
          <div className="grid grid-cols-2 gap-2.5 @3xl/design-lab:grid-cols-4 @3xl/design-lab:gap-3">
            {(
              [
                {
                  label: "Sessions this week",
                  value: "14",
                  tone: "primary" as const,
                  Icon: CalendarIcon,
                },
                {
                  label: "Active clients",
                  value: "22",
                  tone: "info" as const,
                  Icon: UsersIcon,
                },
                {
                  label: "Income",
                  value: "$48k",
                  tone: "success" as const,
                  Icon: StarIcon,
                },
                {
                  label: "Rating",
                  value: "4.9",
                  sub: "88 reviews",
                  tone: "secondary" as const,
                  Icon: StarIcon,
                },
              ] as const
            ).map(({ label, value, tone, Icon, ...rest }) => (
              <PulseCardKpi
                key={label}
                tone={tone}
                value={value}
                label={label}
                sub={"sub" in rest ? rest.sub : undefined}
                icon={<Icon aria-hidden className="size-[18px]" />}
              />
            ))}
          </div>
        </PatternBlock>

        <PatternBlock patternId="c.bookings" title="Booking list item (past)">
          <PulseCard className="flex flex-col rounded-2xl p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <ContentText variant="smallEmphasis" as="p">
                    Dmitry Sokolov
                  </ContentText>
                  <StatusBadge status="completed">Completed</StatusBadge>
                </div>
                <ContentText variant="metaSecondary" as="p" className="mt-0.5">
                  Strength · 60 min
                </ContentText>
                <ContentText variant="metaPrimary" as="p" className="mt-1.5">
                  May 15, 18:30
                </ContentText>
              </div>
            </div>
            <Button size="sm" variant="tonal" className="mt-3 min-h-11 w-full">
              <StarIcon className="size-3.5" aria-hidden />
              Leave a review
            </Button>
          </PulseCard>
        </PatternBlock>

        <PatternBlock patternId="pattern-booking" title="Booking list item (upcoming)">
          <PulseCard variant="compact" interactive tabIndex={0}>
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <ContentText variant="smallEmphasis" as="p">
                  Anna Romanova
                </ContentText>
                <ContentText variant="metaSecondary" as="p" className="mt-0.5">
                  Morning HIIT · 60 min
                </ContentText>
                <ContentText variant="metaPrimary" as="p" className="mt-1.5">
                  Tomorrow, 08:00
                </ContentText>
              </div>
              <StatusBadge status="confirmed">Confirmed</StatusBadge>
            </div>
          </PulseCard>
        </PatternBlock>

        <PatternBlock patternId="pattern-badges" title="Status badge row">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="verified">Verified</StatusBadge>
            <StatusBadge status="pending">Pending</StatusBadge>
            <StatusBadge status="cancelled">Rejected</StatusBadge>
            <StatusBadge status="completed">Completed</StatusBadge>
          </div>
        </PatternBlock>

        <PatternBlock patternId="pattern-section-header" title="Section header">
          <SectionHeader title="Top trainers" actionHref="#patterns" />
          <div className="flex items-center gap-1">
            <RatingStars value={4.9} size="sm" />
            <ContentText variant="mutedMicro" as="span" className="ml-1 font-mono">
              4.9
            </ContentText>
          </div>
        </PatternBlock>

        <PatternBlock patternId="pattern-empty" title="Empty state">
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No bookings yet</EmptyTitle>
              <EmptyDescription>
                Book your first session with a verified trainer.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>Find trainers</Button>
            </EmptyContent>
          </Empty>
        </PatternBlock>
      </div>
    </DesignLabSection>
  );
}
