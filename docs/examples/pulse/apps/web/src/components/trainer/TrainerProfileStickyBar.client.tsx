"use client";

import Link from "next/link";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import { cn } from "@/lib/utils";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import { formatMoney } from "@/lib/format-money";


export type TrainerProfileStickyBarProps = {
  profile: PublicTrainerProfile;
  isAuthenticated: boolean;
  withBottomNavOffset?: boolean;
};

export function TrainerProfileStickyBar({  profile,
  isAuthenticated,
  withBottomNavOffset = false,
}: TrainerProfileStickyBarProps) {
  const messages = useMessages();
  const locale = useLocale();

  const base = `/book/${profile.id}`;
  const bookHref = isAuthenticated
    ? base
    : `/auth/login?callbackUrl=${encodeURIComponent(base)}`;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-30 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur-md md:hidden",
        withBottomNavOffset
          ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"
          : "bottom-0 pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {profile.fromPriceCents !== null && profile.currency ? (
          <div className="min-w-0">
            <ContentText variant="mutedMicro" as="p">
              {messages.trainer.profile.fromPriceLabel}
            </ContentText>
            <ContentText variant="smallEmphasis" as="p" className="font-heading">
              {formatMoney(profile.fromPriceCents, profile.currency, locale)}
            </ContentText>
          </div>
        ) : null}
        <Button asChild size="lg" className="ml-auto min-w-[140px] shrink-0">
          <Link href={bookHref} prefetch={true}>
            {messages.trainer.profile.bookNow}
          </Link>
        </Button>
      </div>
    </div>
  );
}
