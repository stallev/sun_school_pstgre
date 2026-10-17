"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { updateSchoolTimezoneAction } from "@/actions/app-settings";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/dictionary-types";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";
import { cn } from "@/lib/utils";

type TimezonePickerProps = {
  currentTimeZone: string;
  timeZoneOptions: readonly string[];
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const TimezonePicker = ({
  currentTimeZone,
  timeZoneOptions,
  dictionaries,
  formError,
}: TimezonePickerProps) => {
  const messages = useAdminMessages();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(currentTimeZone);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    updateSchoolTimezoneAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.settings.toastTimezoneSaved,
    formErrorFallback: formError,
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return timeZoneOptions.slice(0, 80);
    return timeZoneOptions.filter((zone) => zone.toLowerCase().includes(normalized)).slice(0, 80);
  }, [query, timeZoneOptions]);

  return (
    <form
      action={formAction}
      id="school-timezone"
      className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <SectionTitle>{messages.settings.timezoneTitle}</SectionTitle>
      <ContentText tone="secondary">{messages.settings.timezoneHint}</ContentText>
      <label className="grid gap-1 text-sm">
        <span>{messages.settings.timezoneSearchLabel}</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={messages.settings.timezoneSearchPlaceholder}
          disabled={pending}
          className="min-h-11"
        />
      </label>
      <input type="hidden" name="timeZone" value={selected} />
      <ul className="max-h-48 overflow-y-auto rounded-lg border border-line bg-paper" role="listbox">
        {filtered.map((zone) => (
          <li key={zone}>
            <button
              type="button"
              role="option"
              aria-selected={selected === zone}
              className={cn(
                "flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-cobalt-soft",
                selected === zone && "bg-cobalt-soft font-medium",
              )}
              onClick={() => setSelected(zone)}
              disabled={pending}
            >
              {zone}
            </button>
          </li>
        ))}
      </ul>
      <Button
        type="submit"
        className={FORM_SUBMIT_BUTTON_CLASS}
        disabled={pending || selected === currentTimeZone}
        aria-busy={pending}
      >
        {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? messages.settings.submitPending : messages.settings.timezoneSave}
      </Button>
    </form>
  );
};
