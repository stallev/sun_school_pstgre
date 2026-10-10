"use client";

import { AdminPageError } from "@/components/admin/AdminPageError";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export default function AdminTrainerDetailError({
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  const messages = useMessages();

  return (
    <AdminPageError
      pageTitle={messages.admin.moderation.applicationDetail}
      title={messages.admin.shared.loadError}
      description={messages.admin.shared.loadErrorDescription}
      retryLabel={messages.admin.shared.retry}
      retry={retry}
    />
  );
}
