"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { updateUserNameAction } from "@/actions/access-admin";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type UpdateUserNameFormProps = {
  userId: string;
  initialNames: { lastName: string; firstName: string; middleName: string };
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const UpdateUserNameForm = ({
  userId,
  initialNames,
  dictionaries,
  formError,
}: UpdateUserNameFormProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    updateUserNameAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.users.toastNameSaved,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="userId" value={userId} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="lastName">{messages.form.lastName}</FieldLabel>
          <Input id="lastName" name="lastName" defaultValue={initialNames.lastName} disabled={pending} />
        </Field>
        <Field>
          <FieldLabel htmlFor="firstName">{messages.form.firstName}</FieldLabel>
          <Input id="firstName" name="firstName" defaultValue={initialNames.firstName} disabled={pending} />
        </Field>
        <Field>
          <FieldLabel htmlFor="middleName">{messages.form.middleName}</FieldLabel>
          <Input id="middleName" name="middleName" defaultValue={initialNames.middleName} disabled={pending} />
        </Field>
        <Field>
          <FieldLabel htmlFor="nameReason">{messages.users.nameReason}</FieldLabel>
          <Input id="nameReason" name="reason" disabled={pending} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} aria-busy={pending} className={FORM_SUBMIT_BUTTON_CLASS}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {messages.approvals.submitPending}
          </>
        ) : (
          messages.users.updateName
        )}
      </Button>
    </form>
  );
};
