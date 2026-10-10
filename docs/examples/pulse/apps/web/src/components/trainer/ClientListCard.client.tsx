"use client";

import Link from "next/link";

import { ContentText, Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import type { TrainerClientListItem } from "@/data/trainer/list-trainer-clients.server";
import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";

export type ClientListCardProps = {
  client: TrainerClientListItem;
};

export function ClientListCard({ client }: ClientListCardProps) {
  const messages = useMessages();
  const locale = useLocale();
  const lastSessionLabel = client.lastSessionAt
    ? formatBookingDateTimeLocal(client.lastSessionAt, locale)
    : "—";

  return (
    <Link href={`/trainer/clients/${client.clientId}`} className="block">
      <PulseCard className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40">
        <UserAvatar
          name={client.displayName}
          src={client.avatarUrl}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Heading as="h3" visualLevel="h5" className="truncate">
              {client.displayName}
            </Heading>
            <ContentText variant="muted" as="span" className="shrink-0 text-xs">
              {messages.trainer.clients.sessionsCount.replace(
                "{count}",
                String(client.sessionCount),
              )}
            </ContentText>
          </div>
          {client.notePreview ? (
            <ContentText variant="muted" as="p" className="mt-1 line-clamp-1 text-xs">
              {client.notePreview}
            </ContentText>
          ) : null}
          <ContentText variant="muted" as="p" className="mt-1 text-xs">
            {messages.trainer.clients.lastSession.replace(
              "{date}",
              lastSessionLabel,
            )}
          </ContentText>
        </div>
      </PulseCard>
    </Link>
  );
}
