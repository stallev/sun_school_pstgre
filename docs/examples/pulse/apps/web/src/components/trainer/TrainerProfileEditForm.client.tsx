"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  FILE_UPLOAD_PURPOSE,
  SPECIALIZATION_SLUGS,
  TRAINER_TIMEZONES,
  formatTrainerTimezoneLabel,
  type OnboardingCertificateRow,
  type SpecializationSlug,
  type TrainerTimezone,
  type UpdateTrainerProfileInput,
} from "@pulse/domain";

import { updateTrainerProfileAction } from "@/actions/trainer/update-trainer-profile";
import { AlertText, ContentText, Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { FileUploadZone } from "@/components/ui/FileUploadZone.client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpecChip } from "@/components/ui/SpecChip";
import { Textarea } from "@/components/ui/textarea";
import type { TrainerProfileForEdit } from "@/data/trainer/get-trainer-profile-for-edit.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { LocaleSettingsRow } from "@/components/i18n/LocaleSettingsRow";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { isIosSafari } from "@/lib/ui/is-ios-safari";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";
import { cn } from "@/lib/utils";

import { TrainerProfileCertificateRows } from "./TrainerProfileCertificateRows.client";

const SPEC_LABELS: Record<SpecializationSlug, string> = {
  cardio: "Cardio",
  pilates: "Pilates",
  strength: "Strength",
  hiit: "HIIT",
  stretching: "Stretching",
};

export type TrainerProfileEditFormProps = {
  profile: TrainerProfileForEdit;
};

function mapCertificates(
  certificates: TrainerProfileForEdit["certificates"],
): OnboardingCertificateRow[] {
  if (certificates.length === 0) {
    return [{ title: "", fileAssetId: undefined }];
  }

  return certificates.map((certificate) => ({
    id: certificate.id,
    title: certificate.title,
    fileAssetId: certificate.fileAssetId ?? undefined,
  }));
}

export function TrainerProfileEditForm({ profile }: TrainerProfileEditFormProps) {
  const messages = useMessages();
  const router = useRouter();
  const [timezone, setTimezone] = useState<TrainerTimezone>(profile.timezone);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photoUrl);
  const [photoFileAssetId, setPhotoFileAssetId] = useState<string | undefined>();
  const [bio, setBio] = useState(profile.bio);
  const [experienceYears, setExperienceYears] = useState(
    profile.experienceYears?.toString() ?? "",
  );
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    profile.specializationSlugs,
  );
  const [certificates, setCertificates] = useState<OnboardingCertificateRow[]>(
    mapCertificates(profile.certificates),
  );
  const [timezoneError, setTimezoneError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const timezoneChanged = timezone !== profile.timezone;

  const toggleSpec = (slug: SpecializationSlug) => {
    setSelectedSpecs((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
  };

  const buildPayload = (): UpdateTrainerProfileInput => ({
    timezone,
    photoFileAssetId,
    bio: bio.trim() || undefined,
    specializationSlugs: selectedSpecs as SpecializationSlug[],
    experienceYears: experienceYears ? Number(experienceYears) : undefined,
    certificates: certificates.filter((row) => row.title.trim().length > 0),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!timezone) {
      setTimezoneError(messages.trainer.onboarding.errors.timezoneRequired);
      return;
    }

    setTimezoneError(undefined);

    startTransition(async () => {
      const payload = buildPayload();

      if (isIosSafari()) {
        setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_FALLBACK);
        const response = await resilientPostFetch("/api/trainer/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { ok: boolean; message?: string };

        if (!result.ok) {
          toast.error(
            result.message ?? messages.trainer.editProfile.errors.generic,
            { duration: PRODUCT_TOAST_DURATION_MS },
          );
          return;
        }

        router.push("/trainer/profile?saved=1");
        return;
      }

      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.SERVER_ACTION);
      const result = await updateTrainerProfileAction(payload);
      if (result && !result.ok) {
        toast.error(
          result.message ?? messages.trainer.editProfile.errors.generic,
          { duration: PRODUCT_TOAST_DURATION_MS },
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8" aria-busy={isPending}>
      <Heading as="h1" visualLevel="h2">
        {messages.trainer.editProfile.title}
      </Heading>

      <div className="mx-auto size-28 md:mx-0">
        <PhotoSlot
          label={messages.trainer.onboarding.photoLabel}
          src={photoUrl}
          aspect="square"
          className="size-28 rounded-full"
          sizes="112px"
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
          <Select
            value={timezone}
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
          {timezoneChanged ? (
            <AlertText className="mt-2">
              {messages.trainer.editProfile.timezoneChangeWarning}
            </AlertText>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-bio">{messages.trainer.onboarding.bioLabel}</FieldLabel>
          <ContentText variant="mutedMicro" as="p" className="mb-2">
            {messages.trainer.onboarding.bioHint}
          </ContentText>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            disabled={isPending}
            rows={5}
          />
        </Field>

        <Field>
          <FieldLabel>{messages.trainer.onboarding.specializationsLabel}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATION_SLUGS.map((slug) => {
              const selected = selectedSpecs.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggleSpec(slug)}
                  disabled={isPending}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SpecChip
                    className={cn(selected && "bg-primary-container text-primary")}
                  >
                    {SPEC_LABELS[slug]}
                  </SpecChip>
                </button>
              );
            })}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-experience">
            {messages.trainer.onboarding.experienceLabel}
          </FieldLabel>
          <Input
            id="profile-experience"
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(event) => setExperienceYears(event.target.value)}
            disabled={isPending}
          />
        </Field>
      </FieldGroup>

      <section className="space-y-4">
        <Heading as="h2" visualLevel="h4">
          {messages.trainer.editProfile.certificatesSection}
        </Heading>
        <TrainerProfileCertificateRows
          rows={certificates}
          disabled={isPending}
          onChange={setCertificates}
        />
      </section>

      <PulseCard className="p-4">
        <ul className="list-none">
          <LocaleSettingsRow />
        </ul>
      </PulseCard>

      <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
        {isPending ? (
          <>
            <Loader2Icon aria-hidden className="size-4 animate-spin" />
            {messages.trainer.editProfile.saving}
          </>
        ) : (
          messages.trainer.editProfile.save
        )}
      </Button>
    </form>
  );
}
