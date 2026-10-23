"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { MutationResult } from "@sunschool/domain";
import { giveElectronicConsentAction } from "@/actions/parent";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useParentMessages } from "@/components/parent/ParentMessagesProvider.client";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { useMutationResultEffect } from "@/lib/ui/use-mutation-result-effects";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type ParentConsentFormProps = {
  pupilId: string;
  pupilName: string;
  textVersion: string;
  fullTextPlaceholder: string;
  dictionaries: Record<string, Dictionary>;
};

export const ParentConsentForm = ({
  pupilId,
  pupilName,
  textVersion,
  fullTextPlaceholder,
  dictionaries,
}: ParentConsentFormProps) => {
  const messages = useParentMessages();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [state, action, pending] = useActionState<
    MutationResult<{ consentId: string }> | null,
    FormData
  >(giveElectronicConsentAction, null);

  useMutationResultEffect(state, (result) => {
    if (result.ok) {
      toast.success(messages.consent.givenToast, { duration: PRODUCT_TOAST_DURATION_MS });
      router.replace("/child");
      router.refresh();
      return;
    }
    const message = result.message
      ? resolveMessageKey(dictionaries, result.message)
      : messages.consent.required;
    toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
  });

  const intro = messages.consent.intro.replace("{name}", pupilName);

  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="pupilId" value={pupilId} />
      <ContentText className="text-sm text-ink-2">{intro}</ContentText>
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2">
        <li>{messages.consent.bulletStorage}</li>
        <li>{messages.consent.bulletWhoSees}</li>
        <li>{messages.consent.bulletWithout}</li>
        <li>{messages.consent.bulletRevoke}</li>
      </ul>
      <Button type="button" variant="outline" className="min-h-11" onClick={() => setShowFull((v) => !v)}>
        {messages.consent.fullTextToggle.replace("{version}", textVersion)}
      </Button>
      {showFull ? (
        <ContentText className="rounded-lg border border-line bg-paper p-3 text-sm text-ink-2">
          {fullTextPlaceholder}
        </ContentText>
      ) : null}
      <div className="flex items-start gap-3">
        <Checkbox
          id="consent-accepted"
          checked={accepted}
          disabled={pending}
          onCheckedChange={(value) => setAccepted(value === true)}
        />
        <Label htmlFor="consent-accepted" className="text-sm leading-snug">
          {messages.consent.checkbox}
        </Label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-11" disabled={pending || !accepted} aria-busy={pending}>
          {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
          {messages.consent.submit}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending}
          render={<a href="/child/data" />}
        >
          {messages.consent.decline}
        </Button>
      </div>
    </form>
  );
};
