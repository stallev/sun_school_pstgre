"use client";

import { useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { MutationResult } from "@sunschool/domain";
import { approveRequestAction } from "@/actions/access-admin";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { RoleSelector } from "@/components/admin/RoleSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActiveGradeOption } from "@/data/access/load-active-grades.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type ApproveRequestDialogProps = {
  requestId: string;
  displayName: string;
  grades: readonly ActiveGradeOption[];
  dictionaries: Record<string, Dictionary>;
  formError: string;
  closeLabel: string;
};

export const ApproveRequestDialog = ({
  requestId,
  displayName,
  grades,
  dictionaries,
  formError,
  closeLabel,
}: ApproveRequestDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    approveRequestAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.approvals.toastApproved,
    formErrorFallback: formError,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="default" />}>
        {messages.approvals.approve}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.approvals.approveTitle}</DialogTitle>
          <DialogDescription>
            {messages.approvals.approveDescription} — {displayName}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="requestId" value={requestId} />
          <RoleSelector grades={grades} disabled={pending} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              {closeLabel}
            </DialogClose>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  {messages.approvals.submitPending}
                </>
              ) : (
                messages.approvals.submitApprove
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
