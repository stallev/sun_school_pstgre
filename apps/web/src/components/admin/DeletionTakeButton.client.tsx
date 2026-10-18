"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { takeDeletionRequestAction } from "@/actions/deletions";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { Button } from "@/components/ui/button";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type DeletionTakeButtonProps = {
  requestId: string;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const DeletionTakeButton = ({ requestId, dictionaries, formError }: DeletionTakeButtonProps) => {
  const messages = useAdminMessages();
  const d = messages.deletions;
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    takeDeletionRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: d.toastTaken,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" variant="outline" className="min-h-11" disabled={pending} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {d.submitPending}
          </>
        ) : (
          d.take
        )}
      </Button>
    </form>
  );
};
