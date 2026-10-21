"use client";

import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PROVIDER } from "@sunschool/domain";
import { startLinkProviderAction, unlinkProviderAction } from "@/actions/access-identity";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";
import { ContentText } from "@/components/atoms";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import type { OwnProfileIdentity } from "@/data/access/load-own-profile.server";
import { AUTHJS_PROVIDER_ID } from "@/lib/auth/provider-map";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

type LinkedIdentityRowProps = {
  identity: OwnProfileIdentity;
  dictionaries: { auth: Dictionary; common: Dictionary };
};

export const LinkedIdentityRow = ({ identity, dictionaries }: LinkedIdentityRowProps) => {
  const messages = useAuthMessages();
  const [linkPending, startLink] = useTransition();
  const [unlinkPending, startUnlink] = useTransition();

  const title =
    identity.provider === LOGIN_PROVIDER.TELEGRAM
      ? messages.profile.telegramTitle
      : messages.profile.credentialsTitle;

  const detail =
    identity.provider === LOGIN_PROVIDER.TELEGRAM ? "" : identity.email ?? "";

  const handleConnectTelegram = () => {
    startLink(async () => {
      const result = await startLinkProviderAction(LOGIN_PROVIDER.TELEGRAM);
      if (!result.ok) {
        const text = result.message
          ? resolveMessageKey(dictionaries, result.message)
          : messages.errors.form;
        toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      await signIn(AUTHJS_PROVIDER_ID.TELEGRAM, { callbackUrl: "/profile" });
    });
  };

  const handleUnlink = () => {
    startUnlink(async () => {
      const result = await unlinkProviderAction(LOGIN_PROVIDER.TELEGRAM);
      if (!result.ok) {
        const text = result.message
          ? resolveMessageKey(dictionaries, result.message)
          : messages.errors.form;
        toast.error(text, { duration: PRODUCT_TOAST_DURATION_MS });
        return;
      }
      toast.success(messages.profile.unlinkedToast, { duration: PRODUCT_TOAST_DURATION_MS });
    });
  };

  const isTelegram = identity.provider === LOGIN_PROVIDER.TELEGRAM;
  const pending = linkPending || unlinkPending;

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <ContentText className="font-medium text-ink">{title}</ContentText>
          <ContentText tone="secondary" className="truncate text-sm">
            {identity.connected
              ? detail || messages.profile.connected
              : messages.profile.notConnected}
          </ContentText>
        </div>
      </div>
      {isTelegram ? (
        identity.connected ? (
          identity.canUnlink ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" className="min-h-11 shrink-0" disabled={pending}>
                  {unlinkPending ? messages.profile.disconnectPending : messages.profile.disconnect}
                </Button>
              }
              title={messages.profile.unlinkConfirmTitle}
              description={messages.profile.unlinkConfirmBody}
              confirmLabel={messages.profile.unlinkConfirm}
              cancelLabel={messages.profile.unlinkCancel}
              onConfirm={handleUnlink}
              destructive
              pending={unlinkPending}
            />
          ) : (
            <StatusText tone="neutral" className="shrink-0 text-sm">
              {messages.profile.lastIdentityHint}
            </StatusText>
          )
        ) : (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0"
            disabled={pending}
            aria-busy={linkPending}
            onClick={handleConnectTelegram}
          >
            {linkPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
            {linkPending ? messages.profile.connectPending : messages.profile.connect}
          </Button>
        )
      ) : identity.connected ? (
        <StatusText tone="ok" className="shrink-0 text-sm">
          {messages.profile.connected}
        </StatusText>
      ) : null}
    </li>
  );
};
