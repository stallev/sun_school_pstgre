import {
  ClockIcon,
  GlobeIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";

import { ContentText, Heading, SectionEyebrow } from "@/components/atoms";
import { Container } from "@/components/ui/container";
import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import { getMessages } from "@/lib/messages/server";

const KPI_ICONS = [UsersIcon, LayersIcon, GlobeIcon, ClockIcon] as const;
const KPI_TONES = ["primary", "info", "secondary", "success"] as const;

export async function FeaturesHero() {
  const messages = await getMessages();
  const { hero } = messages.platformFeatures;

  return (
    <section
      aria-labelledby="features-hero-heading"
      className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)] pt-14 md:pt-[72px]"
    >
      <Container variant="marketing" className="py-14 md:py-20">
        <SectionEyebrow tone="outline" className="mb-5 inline-flex text-[13px]">
          {hero.eyebrow}
        </SectionEyebrow>
        <Heading
          as="h1"
          id="features-hero-heading"
          visualLevel="display"
          className="mb-5 max-w-3xl text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.02] tracking-[-0.04em]"
        >
          {hero.title}
          <br />
          <span className="text-primary">{hero.titleAccent}</span>
        </Heading>
        <ContentText variant="lead" as="p" className="mb-10 max-w-2xl">
          {hero.subcopy}
        </ContentText>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {hero.kpis.map((kpi, index) => {
            const Icon = KPI_ICONS[index] ?? UsersIcon;
            const tone = KPI_TONES[index] ?? "primary";
            return (
              <PulseCardKpi
                key={kpi.label}
                icon={<Icon className="size-4" aria-hidden />}
                tone={tone}
                value={kpi.value}
                label={kpi.label}
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}
