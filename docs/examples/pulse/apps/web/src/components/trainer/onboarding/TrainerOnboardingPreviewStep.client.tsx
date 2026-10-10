"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  submitTrainerApplicationAction,
  type SubmitTrainerApplicationFormState,
} from "@/actions/trainer/submit-trainer-application";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { TrainerOnboardingDraft } from "@/data/trainer/get-trainer-onboarding-draft.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { isIosSafari } from "@/lib/ui/is-ios-safari";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

export type TrainerOnboardingPreviewStepProps = {
  draft: TrainerOnboardingDraft;
  onBack: () => void;
};

export function TrainerOnboardingPreviewStep({  draft,
  onBack,
}: TrainerOnboardingPreviewStepProps) {
  const messages = useMessages();

  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [state, formAction, isActionPending] = useActionState<
    SubmitTrainerApplicationFormState,
    FormData
  >(submitTrainerApplicationAction, null);
  const [isFallbackPending, startFallbackTransition] = useTransition();
  const pending = isActionPending || isFallbackPending;

  useEffect(() => {
    if (!state || state.ok) {
      return;
    }

    toast.error(state.message ?? messages.trainer.onboarding.errors.generic, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });
  }, [state]);

  const handleIosFallbackSubmit = () => {
    startFallbackTransition(async () => {
      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_FALLBACK);

      try {
        const response = await resilientPostFetch("/api/trainer/onboarding/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acceptedTerms: true }),
        });

        const result = (await response.json()) as SubmitTrainerApplicationFormState;
        if (!result || !result.ok) {
          toast.error(
            (result && !result.ok && result.message) ||
              messages.trainer.onboarding.errors.generic,
            { duration: PRODUCT_TOAST_DURATION_MS },
          );
          return;
        }

        router.push("/trainer/dashboard?submitted=1");
      } catch {
        toast.error(messages.trainer.onboarding.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
      }
    });
  };

  const rows = [
    { label: "Timezone", value: draft.timezone || "—" },
    { label: "Bio", value: draft.bio || "—" },
    {
      label: "Specializations",
      value: draft.specializationSlugs.join(", ") || "—",
    },
    {
      label: "Certificates",
      value: String(draft.certificates.length),
    },
    { label: "Services", value: String(draft.services.length) },
  ];

  return (
    <div className="space-y-6">
      <ContentText variant="muted" as="p">
        {messages.trainer.onboarding.previewHint}
      </ContentText>

      <SummaryCard title={messages.trainer.onboarding.stepPreview} rows={rows} />

      <form
        action={formAction}
        onSubmit={(event) => {
          if (isIosSafari()) {
            event.preventDefault();
            if (!termsAccepted) {
              toast.error(messages.trainer.onboarding.errors.termsRequired, {
                duration: PRODUCT_TOAST_DURATION_MS,
              });
              return;
            }
            handleIosFallbackSubmit();
            return;
          }

          setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.SERVER_ACTION);
        }}
        className="space-y-4"
        aria-busy={pending}
      >
        <input type="hidden" name="acceptedTerms" value={termsAccepted ? "on" : ""} />
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              id="trainer-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              disabled={pending}
            />
            <FieldLabel htmlFor="trainer-terms">
              {messages.trainer.onboarding.termsLabel}
            </FieldLabel>
          </Field>
        </FieldGroup>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
            {messages.trainer.onboarding.back}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={pending || !termsAccepted}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <Loader2Icon aria-hidden className="size-4 animate-spin" />
                {messages.trainer.onboarding.submitting}
              </>
            ) : (
              messages.trainer.onboarding.submit
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
