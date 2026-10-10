import { InfoIcon, CheckCircleIcon } from "lucide-react";

import { COMPLAINT_STATUS } from "@pulse/domain";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type ComplaintProcessedBannerProps = {
  status: string;
  assigneeName?: string | null;
};

export async function ComplaintProcessedBanner({  status,
  assigneeName,
}: ComplaintProcessedBannerProps) {
  const messages = await getMessages();

  if (status === COMPLAINT_STATUS.CLOSED) {
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
        <AlertTitle>{messages.admin.complaints.statusClosed}</AlertTitle>
        <AlertDescription>
          {messages.admin.complaints.closeSuccess}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === COMPLAINT_STATUS.IN_REVIEW) {
    const title = assigneeName
      ? messages.admin.complaints.inReviewBannerAssignee.replace(
          "{name}",
          assigneeName,
        )
      : messages.admin.complaints.inReviewBanner;

    return (
      <Alert
        className={cn(
          "border-[hsl(var(--color-info-container))]/40 bg-[hsl(var(--color-info-container))]/30",
        )}
      >
        <InfoIcon className="text-[hsl(var(--color-info))]" aria-hidden />
        <AlertTitle>{title}</AlertTitle>
      </Alert>
    );
  }

  return null;
}
