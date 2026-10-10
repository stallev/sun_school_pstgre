"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  SPECIALIZATION_SLUGS,
  TRAINER_MUTATION_ERROR_CODES,
  type SaveOnboardingStep2Input,
  type SpecializationSlug,
} from "@pulse/domain";

import { saveOnboardingStep2Action } from "@/actions/trainer/save-onboarding-step-2";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SpecChip } from "@/components/ui/SpecChip";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  validateOnboardingStep2Input,
  type OnboardingStep2FieldErrors,
} from "@/lib/trainer/validate-onboarding-step-2";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { cn } from "@/lib/utils";

const SPEC_LABELS: Record<SpecializationSlug, string> = {
  cardio: "Cardio",
  pilates: "Pilates",
  strength: "Strength",
  hiit: "HIIT",
  stretching: "Stretching",
};

export type TrainerOnboardingProfessionalStepProps = {
  initialBio: string;
  initialExperienceYears: number | null;
  initialSpecializations: string[];
  onBack: () => void;
  onNext: () => void;
};

export function TrainerOnboardingProfessionalStep({  initialBio,
  initialExperienceYears,
  initialSpecializations,
  onBack,
  onNext,
}: TrainerOnboardingProfessionalStepProps) {
  const messages = useMessages();

  const [bio, setBio] = useState(initialBio);
  const [experienceYears, setExperienceYears] = useState(
    initialExperienceYears?.toString() ?? "",
  );
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(initialSpecializations);
  const [fieldErrors, setFieldErrors] = useState<OnboardingStep2FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const buildPayload = (): SaveOnboardingStep2Input => ({
    bio: bio.trim() || undefined,
    specializationSlugs: selectedSpecs as SpecializationSlug[],
    experienceYears: experienceYears.trim() ? Number(experienceYears) : undefined,
  });

  const toggleSpec = (slug: SpecializationSlug) => {
    setSelectedSpecs((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
    if (fieldErrors.specializationSlugs) {
      setFieldErrors((current) => ({ ...current, specializationSlugs: undefined }));
    }
  };

  const handleNext = () => {
    const payload = buildPayload();
    const nextErrors = validateOnboardingStep2Input(payload, messages);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await saveOnboardingStep2Action(payload);

      if (!result?.ok) {
        if (result?.code === TRAINER_MUTATION_ERROR_CODES.VALIDATION) {
          setFieldErrors(validateOnboardingStep2Input(payload, messages));
          return;
        }

        toast.error(result?.message ?? messages.trainer.onboarding.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        return;
      }

      onNext();
    });
  };

  return (
    <div className="space-y-6">
      <FieldGroup>
        <Field data-invalid={fieldErrors.bio ? true : undefined}>
          <FieldLabel htmlFor="bio">{messages.trainer.onboarding.bioLabel}</FieldLabel>
          <ContentText variant="mutedMicro" as="p" className="mb-2">
            {messages.trainer.onboarding.bioHint}
          </ContentText>
          <Textarea
            id="bio"
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
              if (fieldErrors.bio) {
                setFieldErrors((current) => ({ ...current, bio: undefined }));
              }
            }}
            disabled={isPending}
            rows={5}
            aria-invalid={Boolean(fieldErrors.bio)}
            aria-describedby={fieldErrors.bio ? "bio-error" : undefined}
          />
          {fieldErrors.bio ? (
            <FieldError id="bio-error">{fieldErrors.bio}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.specializationSlugs ? true : undefined}>
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
                    className={cn(
                      selected && "bg-primary-container text-primary",
                    )}
                  >
                    {SPEC_LABELS[slug]}
                  </SpecChip>
                </button>
              );
            })}
          </div>
          {fieldErrors.specializationSlugs ? (
            <FieldError>{fieldErrors.specializationSlugs}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={fieldErrors.experienceYears ? true : undefined}>
          <FieldLabel htmlFor="experience">
            {messages.trainer.onboarding.experienceLabel}
          </FieldLabel>
          <Input
            id="experience"
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(event) => {
              setExperienceYears(event.target.value);
              if (fieldErrors.experienceYears) {
                setFieldErrors((current) => ({ ...current, experienceYears: undefined }));
              }
            }}
            disabled={isPending}
            aria-invalid={Boolean(fieldErrors.experienceYears)}
            aria-describedby={
              fieldErrors.experienceYears ? "experience-error" : undefined
            }
          />
          {fieldErrors.experienceYears ? (
            <FieldError id="experience-error">{fieldErrors.experienceYears}</FieldError>
          ) : null}
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
