"use client";

import { ContentText } from "@/components/atoms";
import { CustomLink } from "@/components/ui/CustomLink";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

export type TimezoneLabelProps = {
  label: string;
};

export function TimezoneLabel({ label }: TimezoneLabelProps) {
  const messages = useMessages();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ContentText variant="muted" as="p" className="font-mono text-xs">
        {label}
      </ContentText>
      <CustomLink href="/trainer/profile" className="text-xs">
        {messages.trainer.schedule.timezoneEditLink}
      </CustomLink>
    </div>
  );
}
