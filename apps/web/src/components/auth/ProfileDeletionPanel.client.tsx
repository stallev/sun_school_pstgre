"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { cancelDeletionRequestAction, createDeletionRequestAction } from "@/actions/deletions";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnDeletionRequest } from "@/data/deletions/load-own-deletion-request.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";
import { toast } from "sonner";

type ProfileDeletionPanelProps = {
  openRequest: OwnDeletionRequest | null;
  locale: string;
  dictionaries: { auth: Dictionary; common: Dictionary };
};

export const ProfileDeletionPanel = ({ openRequest, locale, dictionaries }: ProfileDeletionPanelProps) => {
  const messages = useAuthMessages().profile;
  const dateFmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium" });
  const [createState, createAction, createPending] = useActionState<
    MutationResult<{ requestId: string }> | null,
    FormData
  >(createDeletionRequestAction, null);
  const [cancelState, cancelAction, cancelPending] = useActionState<MutationResult | null, FormData>(
    cancelDeletionRequestAction,
    null,
  );

  useMutationResultEffect(createState, (result) => {
    if (result.ok) toast.success(messages.deletionToastCreated, { duration: PRODUCT_TOAST_DURATION_MS });
    else if (result.message) {
      toast.error(resolveMessageKey(dictionaries, result.message), { duration: PRODUCT_TOAST_DURATION_MS });
    }
  });
  useMutationResultEffect(cancelState, (result) => {
    if (result.ok) toast.success(messages.deletionToastCancelled, { duration: PRODUCT_TOAST_DURATION_MS });
    else if (result.message) {
      toast.error(resolveMessageKey(dictionaries, result.message), { duration: PRODUCT_TOAST_DURATION_MS });
    }
  });

  if (openRequest) {
    const requested = dateFmt.format(new Date(openRequest.requestedAtIso));
    const due = dateFmt.format(new Date(openRequest.dueOnIso));
    const pendingLine = messages.deletionPending.replace("{date}", requested).replace("{due}", due);
    return (
      <div className="space-y-3">
        <ContentText>{pendingLine}</ContentText>
        <form action={cancelAction}>
          <input type="hidden" name="requestId" value={openRequest.requestId} />
          <Button type="submit" variant="outline" disabled={cancelPending} aria-busy={cancelPending}>
            {cancelPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                {messages.deletionSubmitPending}
              </>
            ) : (
              messages.deletionCancelBtn
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ContentText tone="secondary">{messages.deletionIntro}</ContentText>
      <form action={createAction} className="space-y-3" aria-busy={createPending}>
        <Field>
          <FieldLabel htmlFor="profile-deletion-reason">
            {messages.deletionReasonLabel}{" "}
            <span className="font-normal text-muted-foreground">({messages.deletionReasonOptional})</span>
          </FieldLabel>
          <Input id="profile-deletion-reason" name="reason" disabled={createPending} maxLength={500} />
        </Field>
        <Button type="submit" variant="destructive" disabled={createPending} aria-busy={createPending}>
          {createPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {messages.deletionSubmitPending}
            </>
          ) : (
            messages.deletionRequestBtn
          )}
        </Button>
      </form>
    </div>
  );
};
