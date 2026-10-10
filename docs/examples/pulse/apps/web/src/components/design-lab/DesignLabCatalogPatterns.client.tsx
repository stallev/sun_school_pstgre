"use client";

import { ClockIcon, FilterIcon, ShieldIcon } from "lucide-react";
import { useState } from "react";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { IconBadge } from "@/components/ui/IconBadge";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { MetaRow } from "@/components/ui/MetaRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { SchedulePicker } from "@/components/ui/SchedulePicker.client";
import { SearchTrigger } from "@/components/ui/SearchTrigger";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { WizardHeader } from "@/components/ui/WizardHeader";
import {
  DesignLabSection,
} from "@/components/design-lab/DesignLabSection";
import {
  SCHEDULE_DAYS_FIXTURE,
  SCHEDULE_SLOTS_FIXTURE,
  SERVICE_CHOICES_FIXTURE,
} from "@/lib/design-lab/matrices";

function PatternBlock({
  patternId,
  title,
  children,
}: {
  patternId: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-[var(--card-radius-lg)] border border-border bg-card p-4">
      <div>
        <ContentText variant="smallEmphasis" as="p">
          {title}
        </ContentText>
        <ContentText variant="mutedMicro" as="p">
          Prototype:{" "}
          <span className="font-mono">{patternId}</span>
        </ContentText>
      </div>
      {children}
    </div>
  );
}

export function DesignLabCatalogPatterns() {
  const [activeDay, setActiveDay] = useState("d3");
  const [serviceId, setServiceId] = useState("s1");

  return (
    <DesignLabSection id="catalog-patterns" title="L3 — Catalog patterns">
      <div className="space-y-6">
        <PatternBlock patternId="c.home" title="SectionHeader">
          <SectionHeader title="Top trainers" actionHref="#catalog-patterns" />
        </PatternBlock>

        <PatternBlock patternId="c.catalog" title="PageHeader + SearchTrigger">
          <div className="space-y-4">
            <PageHeader
              title="Catalog"
              action={
                <div className="relative">
                  <Button type="button" variant="outline" size="icon" aria-label="Open filters">
                    <FilterIcon aria-hidden className="size-[18px]" />
                  </Button>
                  <IconBadge count={3} className="absolute -top-1 -right-1" />
                </div>
              }
            />
            <SearchTrigger href="#catalog-patterns" />
          </div>
        </PatternBlock>

        <PatternBlock patternId="c.book" title="WizardHeader">
          <WizardHeader
            step={2}
            totalSteps={4}
            stepLabel="Time"
            totalLabel="$43.40"
            onBack={() => undefined}
          />
        </PatternBlock>

        <PatternBlock patternId="c.book" title="ChoiceCard — service pick">
          <div className="space-y-2.5">
            {SERVICE_CHOICES_FIXTURE.map((service) => (
              <ChoiceCard
                key={service.id}
                selected={serviceId === service.id}
                title={service.name}
                meta={
                  <MetaRow icon={<ClockIcon className="size-3" />}>
                    {service.duration} min
                  </MetaRow>
                }
                trailing={`$${service.price}`}
                onClick={() => setServiceId(service.id)}
              />
            ))}
          </div>
        </PatternBlock>

        <PatternBlock patternId="c.book" title="SchedulePicker">
          <SchedulePicker
            days={SCHEDULE_DAYS_FIXTURE}
            slots={SCHEDULE_SLOTS_FIXTURE}
            activeDayId={activeDay}
            selectedSlotId="t1"
            onDayChange={setActiveDay}
          />
        </PatternBlock>

        <PatternBlock patternId="c.book" title="KeyValueRow + SummaryCard">
          <SummaryCard
            header={
              <div className="flex items-center gap-3">
                <UserAvatar name="Anna Romanova" size="md" />
                <div className="min-w-0">
                  <ContentText variant="smallEmphasis" as="p" className="truncate">
                    Anna Romanova
                  </ContentText>
                  <ContentText variant="mutedMicro" as="p" className="truncate">
                    HIIT · Functional
                  </ContentText>
                </div>
              </div>
            }
            rows={[
              { label: "Service", value: "Morning HIIT" },
              { label: "Duration", value: "60 min" },
              { label: "Time", value: "Thu 23 · 10:00" },
            ]}
            totals={[
              { label: "Service", value: "$40.00" },
              { label: "Fee 6%", value: "$2.40" },
              { label: "Total", value: "$42.40" },
            ]}
            footer={
              <MetaRow icon={<ShieldIcon className="size-3.5 text-[color:var(--green-text)]" />}>
                Free cancellation up to 24h
              </MetaRow>
            }
          />
        </PatternBlock>

        <PatternBlock patternId="c.book" title="KeyValueRow — confirmation pairs">
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <KeyValueRow label="Trainer" value="Anna Romanova" />
            <KeyValueRow label="Service" value="Morning HIIT" />
            <KeyValueRow label="Date and time" value="Thu, May 23 · 10:00" />
          </div>
        </PatternBlock>
      </div>
    </DesignLabSection>
  );
}
