"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  FILE_UPLOAD_PURPOSE,
  TRAINER_TIMEZONES,
  formatTrainerTimezoneLabel,
  type TrainerTimezone,
} from "@pulse/domain";

import { saveOnboardingStep1Action } from "@/actions/trainer/save-onboarding-step-1";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/ui/FileUploadZone.client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type TrainerOnboardingPersonalStepProps = {
  initialTimezone: TrainerTimezone | "";
  initialPhotoUrl: string | null;
  onBack: () => void;
  onNext: () => void;
};

export function TrainerOnboardingPersonalStep({  initialTimezone,
  initialPhotoUrl,
  onBack,
  onNext,
}: TrainerOnboardingPersonalStepProps) {
  const messages = useMessages();

  const [timezone, setTimezone] = useState<TrainerTimezone | "">(initialTimezone);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [photoFileAssetId, setPhotoFileAssetId] = useState<string | undefined>();
  const [timezoneError, setTimezoneError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const handleNext = () => {
    if (!timezone) {
      setTimezoneError(messages.trainer.onboarding.errors.timezoneRequired);
      return;
    }

    setTimezoneError(undefined);
    startTransition(async () => {
      const result = await saveOnboardingStep1Action({
        timezone,
        photoFileAssetId,
      });

      if (!result?.ok) {
        toast.error(result?.message ?? messages.trainer.onboarding.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        if (result?.code === "VALIDATION") {
          setTimezoneError(messages.trainer.onboarding.errors.timezoneRequired);
        }
        return;
      }

      onNext();
    });
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto size-24">
        <PhotoSlot
          label={messages.trainer.onboarding.photoLabel}
          src={photoUrl}
          aspect="square"
          className="size-24 rounded-full"
          sizes="96px"
        />
      </div>

      <FileUploadZone
        purpose={FILE_UPLOAD_PURPOSE.PROFILE_PHOTO}
        accept="image/jpeg,image/png,image/webp"
        label={messages.trainer.onboarding.photoUpload}
        disabled={isPending}
        onUploaded={({ fileAssetId, readUrl }) => {
          setPhotoFileAssetId(fileAssetId);
          setPhotoUrl(readUrl);
        }}
      />

      <FieldGroup>
        <Field data-invalid={timezoneError ? true : undefined}>
          <FieldLabel>{messages.trainer.onboarding.timezoneLabel}</FieldLabel>
          <ContentText variant="mutedMicro" as="p" className="mb-2">
            {messages.trainer.onboarding.timezoneHint}
          </ContentText>
          <Select
            value={timezone || undefined}
            onValueChange={(value) => setTimezone(value as TrainerTimezone)}
            disabled={isPending}
          >
            <SelectTrigger aria-invalid={timezoneError ? true : undefined}>
              <SelectValue placeholder={messages.trainer.onboarding.timezonePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {TRAINER_TIMEZONES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {formatTrainerTimezoneLabel(entry)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {timezoneError ? <FieldError>{timezoneError}</FieldError> : null}
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          {messages.trainer.onboarding.back}
        </Button>
        <Button type="button" className="flex-1" onClick={handleNext} disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              {messages.trainer.onboarding.nextSaving}
            </>
          ) : (
            messages.trainer.onboarding.next
          )}
        </Button>
      </div>
    </div>
  );
}
