"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { enableAccessAction } from "@/actions/access-admin";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type EnableAccessConfirmProps = {
  userId: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  cancelLabel: string;
};

export const EnableAccessConfirm = ({
  userId,
  dictionaries,
  formError,
  cancelLabel,
}: EnableAccessConfirmProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    enableAccessAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.users.toastEnabled,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction} id={`enable-${userId}`}>
      <input type="hidden" name="userId" value={userId} />
      <ConfirmDialog
        trigger={
          <Button type="button" variant="outline" disabled={pending} aria-busy={pending}>
            {messages.users.enableAccess}
          </Button>
        }
        title={messages.users.enableConfirmTitle}
        description={messages.users.enableConfirmDescription}
        confirmLabel={messages.users.enableAccess}
        cancelLabel={cancelLabel}
        pending={pending}
        onConfirm={() => {
          const form = document.getElementById(`enable-${userId}`) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </form>
  );
};
