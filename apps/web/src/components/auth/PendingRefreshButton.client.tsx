"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";

export const PendingRefreshButton = () => {
  const messages = useAuthMessages();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 w-full"
      disabled={pending}
      aria-busy={pending}
      onClick={handleRefresh}
    >
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          {messages.pending.checkStatusPending}
        </>
      ) : (
        messages.pending.checkStatus
      )}
    </Button>
  );
};
