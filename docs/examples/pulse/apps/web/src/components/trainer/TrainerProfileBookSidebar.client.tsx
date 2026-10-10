"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import { formatMoney } from "@/lib/format-money";


export type TrainerProfileBookSidebarProps = {
  profile: PublicTrainerProfile;
  isAuthenticated: boolean;
};

export function TrainerProfileBookSidebar({  profile,
  isAuthenticated,
}: TrainerProfileBookSidebarProps) {
  const messages = useMessages();
  const locale = useLocale();

  const [selectedServiceId, setSelectedServiceId] = useState(
    profile.defaultServiceId ?? profile.services[0]?.id ?? "",
  );

  const selectedService = useMemo(
    () => profile.services.find((service) => service.id === selectedServiceId) ?? null,
    [profile.services, selectedServiceId],
  );

  const bookHref = useMemo(() => {
    const base = `/book/${profile.id}`;
    const query = selectedServiceId ? `?serviceId=${selectedServiceId}` : "";
    const target = `${base}${query}`;

    if (isAuthenticated) {
      return target;
    }

    return `/auth/login?callbackUrl=${encodeURIComponent(target)}`;
  }, [isAuthenticated, profile.id, selectedServiceId]);

  const priceCents = selectedService?.priceCents ?? profile.fromPriceCents;
  const currency = selectedService?.currency ?? profile.currency;

  return (
    <PulseCard className="sticky top-24 hidden p-5 md:block">
      <ContentText variant="mutedMicro" as="p">
        {messages.trainer.profile.fromPriceLabel}
      </ContentText>
      {priceCents !== null && currency ? (
        <ContentText variant="smallEmphasis" as="p" className="mt-1 font-heading text-[36px]">
          {formatMoney(priceCents, currency, locale)}
        </ContentText>
      ) : null}
      <ContentText variant="mutedMicro" as="p" className="mt-1">
        {messages.trainer.profile.perSessionLabel}
      </ContentText>

      {profile.services.length > 1 ? (
        <label className="mt-4 block space-y-2">
          <ContentText variant="mutedMicro" as="span">
            {messages.trainer.profile.serviceSelectLabel}
          </ContentText>
          <select
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            {profile.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Button asChild size="lg" className="mt-4 w-full">
        <Link href={bookHref} prefetch={true}>
          {messages.trainer.profile.bookNow}
        </Link>
      </Button>
    </PulseCard>
  );
}
