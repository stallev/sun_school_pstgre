"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export default function TrainersError({
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const messages = useMessages();

  return (
    <div className="space-y-4">
      <PageHeader title={messages.catalog.title} />
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden />
        <AlertTitle>{messages.catalog.error.title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{messages.catalog.error.description}</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            {messages.catalog.error.retry}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
