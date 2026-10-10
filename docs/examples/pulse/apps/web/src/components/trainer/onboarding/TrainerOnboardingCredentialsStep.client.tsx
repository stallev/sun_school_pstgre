"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { TRAINER_MUTATION_ERROR_CODES } from "@pulse/domain";

import { AlertText, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  registerTrainerAction,
  type RegisterTrainerFormState,
} from "@/actions/auth/register-trainer";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type TrainerOnboardingCredentialsStepProps = {
  onSuccess: () => void;
};

export function TrainerOnboardingCredentialsStep({  onSuccess,
}: TrainerOnboardingCredentialsStepProps) {
  const messages = useMessages();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [state, formAction, pending] = useActionState<
    RegisterTrainerFormState,
    FormData
  >(async (prev, formData) => {
    const result = await registerTrainerAction(prev, formData);
    if (result?.ok) {
      onSuccess();
    }
    return result;
  }, null);

  const emailError =
    state && !state.ok && state.code === TRAINER_MUTATION_ERROR_CODES.DUPLICATE_EMAIL
      ? state.message
      : undefined;

  useEffect(() => {
    if (state && !state.ok && state.message) {
      toast.error(state.message, { duration: PRODUCT_TOAST_DURATION_MS });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
      <input
        type="hidden"
        name="acceptedTerms"
        value={termsAccepted ? "on" : ""}
      />
      <ContentText variant="muted" as="p">
        {messages.trainer.onboarding.credentialsTitle}
      </ContentText>

      {state && !state.ok && state.message && !emailError ? (
        <AlertText>{state.message}</AlertText>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">
            {messages.auth.register.fullNameLabel}
          </FieldLabel>
          <Input id="fullName" name="fullName" autoComplete="name" required disabled={pending} />
        </Field>
        <Field data-invalid={emailError ? true : undefined}>
          <FieldLabel htmlFor="email">{messages.auth.register.emailLabel}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            aria-invalid={emailError ? true : undefined}
          />
          {emailError ? <FieldError>{emailError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">
            {messages.auth.register.passwordLabel}
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">
            {messages.auth.register.confirmPasswordLabel}
          </FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            disabled={pending}
          />
          <FieldLabel htmlFor="terms">{messages.auth.register.termsLabel}</FieldLabel>
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={pending || !termsAccepted} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2Icon aria-hidden className="size-4 animate-spin" />
            {messages.auth.register.submitting}
          </>
        ) : (
          messages.trainer.onboarding.next
        )}
      </Button>
    </form>
  );
}
