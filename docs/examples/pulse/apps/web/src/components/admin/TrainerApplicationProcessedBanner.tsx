import { CheckCircleIcon, XCircleIcon } from "lucide-react";

import { TRAINER_STATUS } from "@pulse/domain";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type TrainerApplicationProcessedBannerProps = {
  status: string;
  rejectionReason?: string | null;
};

export async function TrainerApplicationProcessedBanner({  status,
  rejectionReason,
}: TrainerApplicationProcessedBannerProps) {
  const messages = await getMessages();

  if (status === TRAINER_STATUS.APPROVED) {
    return (
      <Alert
        className={cn(
          "border-[hsl(var(--color-success-container))]/40 bg-[hsl(var(--color-success-container))]/30",
        )}
      >
        <CheckCircleIcon
          className="text-[hsl(var(--color-success))]"
          aria-hidden
        />
        <AlertTitle>{messages.admin.moderation.statusApproved}</AlertTitle>
        <AlertDescription>
          {messages.admin.moderation.approveSuccess}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === TRAINER_STATUS.REJECTED) {
    return (
      <Alert variant="destructive">
        <XCircleIcon aria-hidden />
        <AlertTitle>{messages.admin.moderation.statusRejected}</AlertTitle>
        {rejectionReason ? (
          <AlertDescription className="space-y-1">
            <p className="font-medium">
              {messages.admin.moderation.rejectionReasonTitle}
            </p>
            <p>{rejectionReason}</p>
          </AlertDescription>
        ) : null}
      </Alert>
    );
  }

  return null;
}
