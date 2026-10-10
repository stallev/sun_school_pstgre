import { ClockIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { SpecChip } from "@/components/ui/SpecChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TrainerApplicationDetail } from "@/data/admin/get-trainer-application.server";
import { computeWaitingDays } from "@/lib/admin/compute-waiting-days";
import { getTrainerStatusBadge } from "@/lib/admin/trainer-application-status";
import { formatAdminRelativeDate } from "@/lib/date/format-admin-relative";
import { getLocale, getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type TrainerApplicationProfileCardProps = {
  application: TrainerApplicationDetail;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function TrainerApplicationProfileCard({  application,
}: TrainerApplicationProfileCardProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  const waitingDays = computeWaitingDays(application.submittedAt);
  const isLongWait = waitingDays >= 3;
  const statusBadge = getTrainerStatusBadge(application.status, messages);

  return (
    <PulseCard variant="base" className="rounded-2xl">
      <PulseCardContent density="sm" className="space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0">
            {application.photoUrl ? (
              <AvatarImage src={application.photoUrl} alt="" />
            ) : null}
            <AvatarFallback>{getInitials(application.fullName)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <ContentText as="p" className="text-[15px] font-medium">
              {application.fullName}
            </ContentText>
            <ContentText as="p" variant="mutedMicro">
              {application.email}
            </ContentText>
            {application.specializationNames.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {application.specializationNames.map((name) => (
                  <SpecChip key={name}>{name}</SpecChip>
                ))}
              </div>
            ) : null}
          </div>

          <StatusBadge status={statusBadge.variant}>{statusBadge.label}</StatusBadge>
        </div>

        <dl className="grid gap-3 text-sm md:max-w-xl">
          <div>
            <dt className="text-muted-foreground">
              {messages.admin.moderation.submittedAt}
            </dt>
            <dd>
              {application.submittedAt
                ? formatAdminRelativeDate(application.submittedAt, locale)
                : "—"}
            </dd>
          </div>
          {application.experienceYears != null ? (
            <div>
              <dt className="text-muted-foreground">
                {messages.admin.moderation.experienceYears}
              </dt>
              <dd>{application.experienceYears}</dd>
            </div>
          ) : null}
          {application.timezone ? (
            <div>
              <dt className="text-muted-foreground">
                {messages.admin.moderation.timezone}
              </dt>
              <dd>{application.timezone}</dd>
            </div>
          ) : null}
        </dl>

        {application.submittedAt ? (
          <div
            className={cn(
              "flex items-center gap-1 text-[12px] text-muted-foreground",
              isLongWait && "text-[hsl(var(--color-warning))]",
            )}
          >
            {isLongWait ? (
              <ClockIcon className="size-3.5 shrink-0" aria-hidden />
            ) : null}
            <span>
              {messages.admin.moderation.waitingDays.replace(
                "{days}",
                String(waitingDays),
              )}
            </span>
          </div>
        ) : null}

        {application.bio ? (
          <ContentText as="p" className="line-clamp-3">
            {application.bio}
          </ContentText>
        ) : null}
      </PulseCardContent>
    </PulseCard>
  );
}
