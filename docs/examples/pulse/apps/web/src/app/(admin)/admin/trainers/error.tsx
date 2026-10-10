"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export default function AdminTrainersError({
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const messages = useMessages();

  return (
    <>
      <PageHeader title={messages.admin.moderation.title} />
      <Alert variant="destructive" className="mt-6">
        <AlertCircleIcon aria-hidden />
        <AlertTitle>{messages.admin.moderation.loadError}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{messages.admin.moderation.loadErrorDescription}</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            {messages.admin.moderation.retry}
          </Button>
        </AlertDescription>
      </Alert>
    </>
  );
}
