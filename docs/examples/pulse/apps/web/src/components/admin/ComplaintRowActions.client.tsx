"use client";

import { COMPLAINT_STATUS } from "@pulse/domain";

import { CloseComplaintDialog } from "@/components/admin/CloseComplaintDialog.client";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import type { ComplaintListItem } from "@/data/admin/list-complaints.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export type ComplaintRowActionsProps = {
  item: ComplaintListItem;
};

export function ComplaintRowActions({ item }: ComplaintRowActionsProps) {
  const messages = useMessages();
  const canQuickClose = item.status === COMPLAINT_STATUS.OPEN;

  return (
    <>
      <Button asChild variant="outline" size="sm" className="min-h-11">
        <CustomLink href={`/admin/complaints/${item.id}`}>
          {messages.admin.complaints.openDetails}
        </CustomLink>
      </Button>

      {canQuickClose ? (
        <CloseComplaintDialog complaintId={item.id} />
      ) : null}
    </>
  );
}
