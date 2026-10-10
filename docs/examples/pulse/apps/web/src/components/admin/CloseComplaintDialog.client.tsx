"use client";

import type { ResolveComplaintDialogProps } from "@/components/admin/ResolveComplaintDialog.client";
import { ResolveComplaintDialog } from "@/components/admin/ResolveComplaintDialog.client";

export type CloseComplaintDialogProps = Omit<
  ResolveComplaintDialogProps,
  "mode"
>;

export function CloseComplaintDialog(props: CloseComplaintDialogProps) {
  return <ResolveComplaintDialog {...props} mode="quick" />;
}
