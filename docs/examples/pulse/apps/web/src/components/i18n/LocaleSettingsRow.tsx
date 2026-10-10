"use client";

import { ContentText } from "@/components/atoms";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

export function LocaleSettingsRow() {
  const messages = useMessages();

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <ContentText as="span" className="text-sm font-medium">
        {messages.locale.settingsLabel}
      </ContentText>
      <LocaleSwitcher variant="settingsRow" />
    </li>
  );
}
