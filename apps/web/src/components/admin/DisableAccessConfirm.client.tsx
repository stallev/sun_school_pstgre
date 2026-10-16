"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { disableAccessAction } from "@/actions/access-admin";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type DisableAccessConfirmProps = {
  userId: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  cancelLabel: string;
};

export const DisableAccessConfirm = ({
  userId,
  dictionaries,
  formError,
  cancelLabel,
}: DisableAccessConfirmProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    disableAccessAction,
    null,
  );
  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.users.toastDisabled,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction} id={`disable-${userId}`}>
      <input type="hidden" name="userId" value={userId} />
      <ConfirmDialog
        trigger={
          <Button type="button" variant="destructive" disabled={pending} aria-busy={pending}>
            {messages.users.disableAccess}
          </Button>
        }
        title={messages.users.disableConfirmTitle}
        description={messages.users.disableConfirmDescription}
        confirmLabel={messages.users.disableAccess}
        cancelLabel={cancelLabel}
        destructive
        pending={pending}
        onConfirm={() => {
          const form = document.getElementById(`disable-${userId}`) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </form>
  );
};
