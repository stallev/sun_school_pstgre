"use client";

import { AlertCircleIcon } from "lucide-react";
import { catchError, type ErrorInfo } from "next/error";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type CatalogGridRegionErrorProps = {
  title: string;
  description: string;
  retryLabel: string;
};

function CatalogGridRegionErrorFallback(
  props: CatalogGridRegionErrorProps,
  { retry }: ErrorInfo,
) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon aria-hidden />
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{props.description}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => retry()}>
          {props.retryLabel}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export const CatalogGridRegionError = catchError(CatalogGridRegionErrorFallback);
