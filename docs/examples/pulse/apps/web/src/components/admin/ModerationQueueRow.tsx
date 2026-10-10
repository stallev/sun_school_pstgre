import { ClockIcon, ChevronRightIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/CustomLink";
import { SpecChip } from "@/components/ui/SpecChip";
import type { TrainerApplicationListItem } from "@/data/admin/list-trainer-applications.server";
import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type ModerationQueueRowProps = {
  item: TrainerApplicationListItem;
  href: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function ModerationQueueRow({ item, href }: ModerationQueueRowProps) {
  const messages = await getMessages();
  const isLongWait = item.waitingDays >= 3;
  const ariaLabel = messages.admin.moderation.openApplicationAria
    .replace("{name}", item.fullName)
    .replace("{days}", String(item.waitingDays));

  return (
    <CustomLink
      href={href}
      aria-label={ariaLabel}
      className="block min-w-0"
    >
      <PulseCard variant="base" interactive className="h-full rounded-2xl">
        <PulseCardContent density="sm" className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-10 shrink-0">
              {item.photoUrl ? (
                <AvatarImage src={item.photoUrl} alt="" />
              ) : null}
              <AvatarFallback>{getInitials(item.fullName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">
                {item.fullName}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {item.email}
              </p>
              {item.specializationNames.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.specializationNames.map((name) => (
                    <SpecChip key={name}>{name}</SpecChip>
                  ))}
                </div>
              ) : null}
            </div>

            <ChevronRightIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>

          {item.submittedAt ? (
            <div className="flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
              <span>
                {messages.admin.moderation.submittedDaysAgo.replace(
                  "{days}",
                  String(item.waitingDays),
                )}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1",
                  isLongWait && "text-[hsl(var(--color-warning))]",
                )}
              >
                {isLongWait ? (
                  <ClockIcon className="size-3 shrink-0" aria-hidden />
                ) : null}
                {messages.admin.moderation.waitingDays.replace(
                  "{days}",
                  String(item.waitingDays),
                )}
              </span>
            </div>
          ) : null}
        </PulseCardContent>
      </PulseCard>
    </CustomLink>
  );
}
