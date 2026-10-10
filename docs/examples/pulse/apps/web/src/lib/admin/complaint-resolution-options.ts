import {
  COMPLAINT_RESOLUTION,
  COMPLAINT_RESOLUTIONS,
  type ComplaintResolution,
} from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export function getComplaintResolutionOptions(messages: Messages): Array<{
  value: ComplaintResolution;
  label: string;
}> {
  const labels: Record<ComplaintResolution, string> = {
    [COMPLAINT_RESOLUTION.NO_ACTION]:
      messages.admin.complaints.resolution.noAction,
    [COMPLAINT_RESOLUTION.WARNING_TO_TRAINER]:
      messages.admin.complaints.resolution.warningToTrainer,
    [COMPLAINT_RESOLUTION.REFUND_RECOMMENDED]:
      messages.admin.complaints.resolution.refundRecommended,
    [COMPLAINT_RESOLUTION.DUPLICATE]:
      messages.admin.complaints.resolution.duplicate,
    [COMPLAINT_RESOLUTION.SPAM]: messages.admin.complaints.resolution.spam,
  };

  return COMPLAINT_RESOLUTIONS.map((value) => ({
    value,
    label: labels[value],
  }));
}
