"use client";

import { ClockIcon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import type { TrainerServiceForEdit } from "@/data/trainer/get-trainer-services-for-edit.server";
import { formatServicePrice } from "@/lib/trainer/format-service-price";

export type ServiceCardProps = {
  service: TrainerServiceForEdit;
  disabled: boolean;
  onToggle: (serviceId: string) => void;
  onEdit: (service: TrainerServiceForEdit) => void;
  onDelete: (service: TrainerServiceForEdit) => void;
};

export function ServiceCard({
  service,
  disabled,
  onToggle,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const messages = useMessages();
  const locale = useLocale();

  return (
    <PulseCard className="space-y-3 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading as="h3" visualLevel="h4">
              {service.name}
            </Heading>
            {!service.isActive ? (
              <Badge variant="secondary">{messages.trainer.services.hiddenBadge}</Badge>
            ) : null}
          </div>
          {service.description ? (
            <ContentText variant="muted" as="p">
              {service.description}
            </ContentText>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={service.isActive}
            onCheckedChange={() => onToggle(service.id)}
            disabled={disabled}
            aria-busy={disabled}
            aria-label={messages.trainer.services.activeLabel}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ContentText variant="mutedMicro" as="span" className="inline-flex items-center gap-1">
          <ClockIcon aria-hidden className="size-3.5" />
          {messages.common.durationMinutes.replace(
            "{minutes}",
            String(service.durationMinutes),
          )}
        </ContentText>
        <ContentText variant="smallEmphasis" as="span" className="font-heading">
          {formatServicePrice(service.priceCents, service.currency, locale)}
        </ContentText>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onEdit(service)}
        >
          {messages.trainer.services.edit}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onDelete(service)}
        >
          {messages.trainer.services.delete}
        </Button>
      </div>
    </PulseCard>
  );
}
