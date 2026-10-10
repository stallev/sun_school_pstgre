import { ArrowRightIcon, CalendarIcon, DollarSignIcon, UsersIcon } from "lucide-react";

import { BenefitRow } from "@/components/ui/BenefitRow";
import { BrandSection } from "@/components/ui/BrandSection";
import { CustomLink } from "@/components/ui/CustomLink";
import { DarkStatTile } from "@/components/ui/DarkStatTile";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { getMessages } from "@/lib/messages/server";


const BENEFIT_ICONS = [UsersIcon, CalendarIcon, DollarSignIcon] as const;

export async function LandingForTrainers() {
  const messages = await getMessages();
  const { forTrainers } = messages.landing;

  return (
    <BrandSection tone="darkForest">
      <div className="grid items-center gap-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <MarketingSectionHeader
            tone="onDark"
            align="left"
            className="mb-0"
            label={forTrainers.label}
            title={
              <>
                {forTrainers.title}{" "}
                <em className="text-[hsl(var(--color-secondary-light))] not-italic">
                  {forTrainers.titleAccent}
                </em>
              </>
            }
            subtitle={forTrainers.subtitle}
          />
          <div className="mt-9 flex flex-col gap-6">
            {forTrainers.benefits.map((benefit, index) => (
              <BenefitRow
                key={benefit.title}
                tone="onDark"
                icon={BENEFIT_ICONS[index] ?? UsersIcon}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
          </div>
          <CustomLink
            as="button"
            href="/auth/register/trainer"
            size="lg"
            className="mt-9 rounded-full px-9"
          >
            {forTrainers.cta}
            <ArrowRightIcon aria-hidden className="size-[18px]" />
          </CustomLink>
        </div>
        <div className="grid grid-cols-2 items-stretch gap-4">
          {forTrainers.stats.map((stat) => (
            <DarkStatTile key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </BrandSection>
  );
}
