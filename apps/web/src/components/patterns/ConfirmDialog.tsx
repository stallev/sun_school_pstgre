"use client";

import type { ReactElement } from "react";
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

type ConfirmDialogProps = {
  /** Trigger element — a `Button`; Base UI renders the trigger as this element. */
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  pending?: boolean;
};

export const ConfirmDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  pending = false,
}: ConfirmDialogProps) => (
  <Dialog>
    <DialogTrigger render={trigger} />
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>
          {cancelLabel}
        </DialogClose>
        <Button
          variant={destructive ? "destructive-solid" : "default"}
          disabled={pending}
          aria-busy={pending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
