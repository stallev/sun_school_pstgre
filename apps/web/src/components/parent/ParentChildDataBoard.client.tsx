"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { MutationResult } from "@sunschool/domain";
import {
  cancelOwnChildDeletionRequestAction,
  createOwnChildDeletionRequestAction,
  revokeElectronicConsentAction,
  updateOwnAdultContactsAction,
} from "@/actions/parent";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParentMessages } from "@/components/parent/ParentMessagesProvider.client";
import type { ParentChildDataPageData } from "@/data/families/load-parent-child-data.server";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";
import { fillMessage } from "@/lib/messages/fill-message";

type ParentChildDataBoardProps = {
  data: Extract<ParentChildDataPageData, { kind: "page" }>;
  dictionaries: Record<string, Dictionary>;
  locale: string;
};

export const ParentChildDataBoard = ({ data, dictionaries, locale }: ParentChildDataBoardProps) => {
  const messages = useParentMessages();
  const [contactsState, contactsAction, contactsPending] = useActionState<
    MutationResult<{ adultId: string }> | null,
    FormData
  >(updateOwnAdultContactsAction, null);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeElectronicConsentAction, null);
  const [deletionState, deletionAction, deletionPending] = useActionState(
    createOwnChildDeletionRequestAction,
    null,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOwnChildDeletionRequestAction,
    null,
  );

  useMutationResultEffect(contactsState, (result) => {
    if (result.ok) {
      toast.success(messages.data.toastContactsSaved, { duration: PRODUCT_TOAST_DURATION_MS });
      return;
    }
    toast.error(
      result.message ? resolveMessageKey(dictionaries, result.message) : messages.data.save,
      { duration: PRODUCT_TOAST_DURATION_MS },
    );
  });
  useMutationResultEffect(revokeState, (result) => {
    if (result.ok) {
      toast.success(messages.consent.revokedToast, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });
      return;
    }
    toast.error(
      result.message ? resolveMessageKey(dictionaries, result.message) : messages.data.save,
      { duration: PRODUCT_TOAST_DURATION_MS },
    );
  });
  useMutationResultEffect(deletionState, (result) => {
    if (result.ok) {
      toast.success(messages.deletion.createdToast, { duration: PRODUCT_TOAST_DURATION_MS });
      return;
    }
    toast.error(
      result.message ? resolveMessageKey(dictionaries, result.message) : messages.data.save,
      { duration: PRODUCT_TOAST_DURATION_MS },
    );
  });
  useMutationResultEffect(cancelState, (result) => {
    if (result.ok) {
      toast.success(messages.deletion.cancelledToast, { duration: PRODUCT_TOAST_DURATION_MS });
      return;
    }
    toast.error(
      result.message ? resolveMessageKey(dictionaries, result.message) : messages.data.save,
      { duration: PRODUCT_TOAST_DURATION_MS },
    );
  });

  const consentActiveLabel =
    data.consentActive && data.consentSignedOn
      ? fillMessage(messages.data.childDataActive, {
          date: new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(data.consentSignedOn)),
          version: data.consentTextVersion ?? "",
        })
      : messages.data.childDataMissing;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <SectionTitle as="h2">{messages.data.contactsTitle}</SectionTitle>
        <form action={contactsAction} className="mt-3 space-y-3" aria-busy={contactsPending}>
          <div>
            <Label htmlFor="phones">{messages.data.phonesLabel}</Label>
            <Input
              id="phones"
              name="phones"
              className="mt-1 min-h-11"
              disabled={contactsPending}
              defaultValue={data.phones.join(", ")}
            />
          </div>
          <div>
            <Label htmlFor="email">{messages.data.emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              className="mt-1 min-h-11"
              disabled={contactsPending}
              defaultValue={data.email ?? ""}
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={contactsPending} aria-busy={contactsPending}>
            {contactsPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {messages.data.save}
          </Button>
        </form>
      </Card>
      <Card className="p-4">
        <SectionTitle as="h2">{messages.data.familyTitle}</SectionTitle>
        <ContentText className="mt-2 text-sm font-medium text-ink">{data.familyName}</ContentText>
        {data.familyAddress ? (
          <ContentText className="mt-1 text-sm text-ink-2">{data.familyAddress}</ContentText>
        ) : null}
        <ContentText className="mt-2 text-sm text-muted">{messages.data.familyReadonly}</ContentText>
      </Card>
      <Card className="p-4">
        <SectionTitle as="h2">{messages.data.consentsTitle}</SectionTitle>
        <ContentText className="mt-2 text-sm text-ink-2">{messages.data.childDataConsent}</ContentText>
        <ContentText className="mt-1 text-sm text-ink">{consentActiveLabel}</ContentText>
        {data.consentActive ? (
          <form action={revokeAction} className="mt-3">
            <input type="hidden" name="pupilId" value={data.pupilId} />
            <input type="hidden" name="confirmDeletion" value="false" />
            <Button type="submit" variant="outline" className="min-h-11" disabled={revokePending} aria-busy={revokePending}>
              {messages.data.revokeConsent}
            </Button>
          </form>
        ) : null}
      </Card>
      <Card className="p-4">
        <SectionTitle as="h2">{messages.data.deletionTitle}</SectionTitle>
        <ContentText className="mt-1 text-sm text-ink-2">{messages.data.deletionHint}</ContentText>
        {data.openDeletion ? (
          <>
            <ContentText className="mt-2 text-sm text-warn">
              {fillMessage(messages.data.deletionOpen, {
                date: new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(data.openDeletion.dueOn)),
              })}
            </ContentText>
            {data.openDeletion.requestedByCurrentUser ? (
              <form action={cancelAction} className="mt-3">
                <input type="hidden" name="requestId" value={data.openDeletion.requestId} />
                <Button type="submit" variant="outline" className="min-h-11" disabled={cancelPending} aria-busy={cancelPending}>
                  {messages.data.deletionCancel}
                </Button>
              </form>
            ) : null}
          </>
        ) : (
          <form action={deletionAction} className="mt-3">
            <input type="hidden" name="pupilId" value={data.pupilId} />
            <Button type="submit" variant="outline" className="min-h-11" disabled={deletionPending} aria-busy={deletionPending}>
              {messages.data.deletionRequest}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
