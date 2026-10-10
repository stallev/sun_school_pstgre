"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export default function TrainerProfileError({
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const messages = useMessages();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden />
        <AlertTitle>{messages.trainer.profile.error.title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{messages.trainer.profile.error.description}</span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              {messages.trainer.profile.error.retry}
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/trainers">
                {messages.trainer.profile.error.backToCatalog}
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
