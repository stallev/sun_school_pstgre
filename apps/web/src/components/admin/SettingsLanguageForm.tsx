"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { MESSAGE_LOCALES, type MessageLocale } from "@/lib/messages/dictionary-types";
import { updateAppLanguageAction } from "@/actions/app-settings";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { ContentText } from "@/components/atoms/ContentText";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type SettingsLanguageFormProps = {
  currentLocale: MessageLocale;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const SettingsLanguageForm = ({
  currentLocale,
  dictionaries,
  formError,
}: SettingsLanguageFormProps) => {
  const messages = useAdminMessages();
  const [locale, setLocale] = useState<MessageLocale>(currentLocale);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    updateAppLanguageAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.settings.toastLanguageSaved,
    formErrorFallback: formError,
  });

  const options = MESSAGE_LOCALES.map((value) => ({
    value,
    label: value === "ru" ? messages.settings.languageRu : messages.settings.languageEn,
  }));

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <SectionTitle>{messages.settings.languageTitle}</SectionTitle>
      <ContentText tone="secondary">{messages.settings.languageHint}</ContentText>
      <input type="hidden" name="locale" value={locale} />
      <SegmentedControl
        aria-label={messages.settings.languageTitle}
        options={options}
        value={locale}
        onValueChange={setLocale}
        disabled={pending}
      />
      <Button
        type="submit"
        className={FORM_SUBMIT_BUTTON_CLASS}
        disabled={pending || locale === currentLocale}
        aria-busy={pending}
      >
        {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? messages.settings.submitPending : messages.settings.languageSave}
      </Button>
    </form>
  );
};
