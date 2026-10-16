"use client";

import { useActionState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { MutationResult } from "@sunschool/domain";
import { updateOwnNameAction } from "@/actions/access";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { AlertText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type ProfileNameFormProps = {
  initialNames: { lastName: string; firstName: string; middleName: string };
  dictionaries: { auth: Dictionary; common: Dictionary };
};

export const ProfileNameForm = ({ initialNames, dictionaries }: ProfileNameFormProps) => {
  const messages = useAuthMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    updateOwnNameAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(messages.profile.savedToast, { duration: PRODUCT_TOAST_DURATION_MS });
    }
  }, [messages.profile.savedToast, state]);

  const formError =
    state && !state.ok
      ? state.message
        ? resolveMessageKey(dictionaries, state.message)
        : messages.errors.form
      : null;

  const fieldErrors = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      {formError ? <AlertText role="alert">{formError}</AlertText> : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-lastName">{messages.register.lastName}</FieldLabel>
          <Input
            id="profile-lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={initialNames.lastName}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors?.lastName)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-firstName">{messages.register.firstName}</FieldLabel>
          <Input
            id="profile-firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={initialNames.firstName}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors?.firstName)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-middleName">{messages.register.middleName}</FieldLabel>
          <Input
            id="profile-middleName"
            name="middleName"
            autoComplete="additional-name"
            defaultValue={initialNames.middleName}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors?.middleName)}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
        {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? messages.profile.savePending : messages.profile.save}
      </Button>
    </form>
  );
};
