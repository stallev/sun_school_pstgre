"use client";

import { useActionState, useMemo, useState } from "react";
import { APP_LOCALE, type MutationResult } from "@sunschool/domain";
import { setGroupLanguageAction, updateGradeSettingsAction } from "@/actions/school-groups";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ContentText, SectionTitle } from "@/components/atoms";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { FormCheckbox } from "@/components/ui/form-checkbox";
import { Input } from "@/components/ui/input";
import type { GroupAdminDetail } from "@/data/school/load-group-admin-detail.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type GroupSettingsFormProps = {
  detail: GroupAdminDetail;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const GroupSettingsForm = ({ detail, dictionaries, formError }: GroupSettingsFormProps) => {
  const messages = useAdminMessages();
  const [languageState, languageAction, languagePending] = useActionState<MutationResult | null, FormData>(
    setGroupLanguageAction,
    null,
  );
  const [settingsState, settingsAction, settingsPending] = useActionState<MutationResult | null, FormData>(
    updateGradeSettingsAction,
    null,
  );
  const [nextLanguage, setNextLanguage] = useState(detail.language);
  const [useVerses, setUseVerses] = useState(detail.settings.useVerses);
  const [useTest, setUseTest] = useState(detail.settings.useTest);
  const [useNotebook, setUseNotebook] = useState(detail.settings.useNotebook);
  const [useSinging, setUseSinging] = useState(detail.settings.useSinging);
  const [maxVersesPerLesson, setMaxVersesPerLesson] = useState(String(detail.settings.maxVersesPerLesson));
  const [recitationDaysN, setRecitationDaysN] = useState(String(detail.settings.recitationDaysN));

  useAdminFormMutation({
    state: languageState,
    dictionaries,
    successMessage: messages.group.toastLanguageSaved,
    formErrorFallback: formError,
  });
  useAdminFormMutation({
    state: settingsState,
    dictionaries,
    successMessage: messages.group.toastSettingsSaved,
    formErrorFallback: formError,
  });

  const pending = languagePending || settingsPending;
  const languageChanged = nextLanguage !== detail.language;
  const settingsDirty = useMemo(
    () =>
      useVerses !== detail.settings.useVerses ||
      useTest !== detail.settings.useTest ||
      useNotebook !== detail.settings.useNotebook ||
      useSinging !== detail.settings.useSinging ||
      maxVersesPerLesson !== String(detail.settings.maxVersesPerLesson) ||
      recitationDaysN !== String(detail.settings.recitationDaysN),
    [
      detail.settings,
      maxVersesPerLesson,
      recitationDaysN,
      useNotebook,
      useSinging,
      useTest,
      useVerses,
    ],
  );
  const weightsJson = JSON.stringify(detail.settings.weights);
  const labelsJson = JSON.stringify(detail.settings.labels);

  return (
    <div className="space-y-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <form action={languageAction} id={`lang-form-${detail.gradeId}`} className="space-y-3">
        <SectionTitle>{messages.group.languageTitle}</SectionTitle>
        <input type="hidden" name="gradeId" value={detail.gradeId} />
        <input type="hidden" name="language" value={nextLanguage} />
        <label className="grid max-w-xs gap-1 text-sm">
          <span>{messages.group.languageLabel}</span>
          <FormSelect
            value={nextLanguage}
            disabled={pending}
            options={[
              { value: APP_LOCALE.RU, label: messages.group.languageRu },
              {
                value: APP_LOCALE.EN,
                label: messages.group.languageEn,
                disabled: !detail.englishBibleReady,
              },
            ]}
            onValueChange={(value) => setNextLanguage(value as typeof detail.language)}
          />
        </label>
        {languageChanged ? (
          <ConfirmDialog
            trigger={
              <Button type="button" disabled={pending} aria-busy={pending}>
                {messages.group.languageSave}
              </Button>
            }
            title={messages.group.languageConfirmTitle}
            description={messages.group.languageConfirmDescription}
            confirmLabel={messages.group.languageSave}
            cancelLabel={messages.form.cancel}
            pending={pending}
            onConfirm={() => {
              const form = document.getElementById(`lang-form-${detail.gradeId}`) as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          />
        ) : null}
      </form>

      <form action={settingsAction} className="space-y-4 border-t border-line pt-6" aria-busy={pending}>
        <SectionTitle>{messages.group.settingsTitle}</SectionTitle>
        <input type="hidden" name="gradeId" value={detail.gradeId} />
        <input type="hidden" name="yearId" value={detail.yearId} />
        <input type="hidden" name="weightsJson" value={weightsJson} />
        <input type="hidden" name="labelsJson" value={labelsJson} />
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["useVerses", messages.group.settingsVerses, useVerses, setUseVerses],
              ["useTest", messages.group.settingsTest, useTest, setUseTest],
              ["useNotebook", messages.group.settingsNotebook, useNotebook, setUseNotebook],
              ["useSinging", messages.group.settingsSinging, useSinging, setUseSinging],
            ] as const
          ).map(([name, label, checked, setChecked]) => (
            <label key={name} className="flex min-h-11 items-center gap-2 text-sm">
              <FormCheckbox
                name={name}
                checked={checked}
                onCheckedChange={setChecked}
                disabled={pending}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="grid max-w-24 gap-1 text-base font-medium">
          <span>{messages.group.settingsMaxVerses}</span>
          <Input
            name="maxVersesPerLesson"
            type="number"
            min={0}
            max={10}
            value={maxVersesPerLesson}
            onChange={(event) => setMaxVersesPerLesson(event.target.value)}
            disabled={pending}
            aria-describedby={`max-verses-hint-${detail.gradeId}`}
          />
          <ContentText tone="secondary" id={`max-verses-hint-${detail.gradeId}`} className="text-sm font-normal">
            {messages.group.settingsMaxVersesHint}
          </ContentText>
        </label>
        <label className="grid max-w-24 gap-1 text-base font-medium">
          <span>{messages.group.settingsRecitationDays}</span>
          <Input
            name="recitationDaysN"
            type="number"
            min={1}
            max={30}
            value={recitationDaysN}
            onChange={(event) => setRecitationDaysN(event.target.value)}
            disabled={pending}
            aria-describedby={`recitation-hint-${detail.gradeId}`}
          />
          <ContentText tone="secondary" id={`recitation-hint-${detail.gradeId}`} className="text-sm font-normal">
            {messages.group.settingsRecitationDaysHint}
          </ContentText>
        </label>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={pending || !settingsDirty}
          aria-busy={pending}
        >
          {settingsPending ? messages.group.submitPending : messages.group.settingsSave}
        </Button>
      </form>
    </div>
  );
};
