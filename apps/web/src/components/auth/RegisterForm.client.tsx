"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { AlertText, ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { ConsentBlock } from "@/components/auth/ConsentBlock.client";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type RegisterFormMode = "registration" | "resubmit" | "consentOnly";

type RegisterFormProps = {
  mode: RegisterFormMode;
  consentVersion: string;
  summaryBullets: string[];
  fullTextParagraphs: string[];
  rejectReason: string | null;
  initialNames: { lastName: string; firstName: string; middleName: string };
  dictionaries: { auth: Dictionary; common: Dictionary };
  action: (prev: MutationResult | null, formData: FormData) => Promise<MutationResult>;
};

export const RegisterForm = ({
  mode,
  consentVersion,
  summaryBullets,
  fullTextParagraphs,
  rejectReason,
  initialNames,
  dictionaries,
  action,
}: RegisterFormProps) => {
  const messages = useAuthMessages();
  const [consentChecked, setConsentChecked] = useState(false);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(action, null);

  const submitLabel =
    mode === "consentOnly"
      ? messages.register.confirmConsent
      : mode === "resubmit"
        ? messages.register.resubmit
        : messages.register.submit;

  const formError =
    state && !state.ok
      ? state.message
        ? resolveMessageKey(dictionaries, state.message)
        : messages.errors.form
      : null;

  const fieldErrors = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
      {rejectReason ? (
        <Banner tone="error" title={messages.register.titleResubmit}>
          <ContentText>{rejectReason}</ContentText>
        </Banner>
      ) : null}

      {formError ? (
        <AlertText role="alert">{formError}</AlertText>
      ) : null}

      {mode !== "consentOnly" ? (
        <section className="space-y-3">
          <SectionTitle>{messages.register.stepData}</SectionTitle>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lastName">{messages.register.lastName}</FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                disabled={pending}
                defaultValue={initialNames.lastName}
                aria-invalid={Boolean(fieldErrors?.lastName)}
              />
              {fieldErrors?.lastName ? (
                <AlertText>{resolveMessageKey(dictionaries, fieldErrors.lastName)}</AlertText>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="firstName">{messages.register.firstName}</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                disabled={pending}
                defaultValue={initialNames.firstName}
                aria-invalid={Boolean(fieldErrors?.firstName)}
              />
              {fieldErrors?.firstName ? (
                <AlertText>{resolveMessageKey(dictionaries, fieldErrors.firstName)}</AlertText>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="middleName">{messages.register.middleName}</FieldLabel>
              <Input
                id="middleName"
                name="middleName"
                autoComplete="additional-name"
                disabled={pending}
                defaultValue={initialNames.middleName}
              />
            </Field>
          </FieldGroup>
        </section>
      ) : null}

      <ConsentBlock
        consentVersion={consentVersion}
        summaryBullets={summaryBullets}
        fullTextParagraphs={fullTextParagraphs}
        checked={consentChecked}
        onCheckedChange={setConsentChecked}
        disabled={pending}
      />
      {consentChecked ? <input type="hidden" name="consentAccepted" value="true" /> : null}

      <Button type="submit" className="min-h-12 w-full" disabled={pending || !consentChecked} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {messages.register.submitPending}
          </>
        ) : (
          submitLabel
        )}
      </Button>

    </form>
  );
};
