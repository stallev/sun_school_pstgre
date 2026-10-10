"use client";

import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";

export type AdminPageErrorProps = {
  pageTitle: string;
  title: string;
  description: string;
  retryLabel: string;
  /** Prefer Next.js 16.3 `retry()` (re-fetch RSC) over `reset()`. */
  retry: () => void;
};

export function AdminPageError({
  pageTitle,
  title,
  description,
  retryLabel,
  retry,
}: AdminPageErrorProps) {
  return (
    <>
      <PageHeader title={pageTitle} />
      <Alert variant="destructive" className="mt-6">
        <AlertCircleIcon aria-hidden />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{description}</span>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            {retryLabel}
          </Button>
        </AlertDescription>
      </Alert>
    </>
  );
}
