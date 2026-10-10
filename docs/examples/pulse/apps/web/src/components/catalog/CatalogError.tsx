import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CatalogRetryButton } from "@/components/catalog/CatalogRetryButton.client";
import { getMessages } from "@/lib/messages/server";


export async function CatalogError() {
  const messages = await getMessages();
  return (
    <Alert variant="destructive">
      <AlertCircleIcon aria-hidden />
      <AlertTitle>{messages.catalog.error.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{messages.catalog.error.description}</span>
        <CatalogRetryButton />
      </AlertDescription>
    </Alert>
  );
}
