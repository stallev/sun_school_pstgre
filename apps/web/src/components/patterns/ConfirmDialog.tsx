"use client";

import type { ReactElement, RefObject } from "react";
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

type ConfirmDialogConfirmProps = {
  variant?: "confirm";
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  pending?: boolean;
};

type ConfirmDialogUnsavedProps = {
  variant: "unsaved";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  finalFocus?: RefObject<HTMLElement | null>;
  title: string;
  description: string;
  saveLabel: string;
  discardLabel: string;
  stayLabel: string;
  pending?: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export type ConfirmDialogProps = ConfirmDialogConfirmProps | ConfirmDialogUnsavedProps;

export const ConfirmDialog = (props: ConfirmDialogProps) => {
  if (props.variant === "unsaved") {
    const {
      open,
      onOpenChange,
      onOpenChangeComplete,
      finalFocus,
      title,
      description,
      saveLabel,
      discardLabel,
      stayLabel,
      pending = false,
      onSave,
      onDiscard,
    } = props;

    return (
      <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <DialogContent finalFocus={finalFocus}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" disabled={pending} className="h-11 sm:h-9" />}>
              {stayLabel}
            </DialogClose>
            <Button
              variant="outline"
              disabled={pending}
              className="h-11 sm:h-9"
              onClick={onDiscard}
            >
              {discardLabel}
            </Button>
            <Button
              variant="default"
              disabled={pending}
              aria-busy={pending}
              autoFocus
              className="h-11 sm:h-9"
              onClick={onSave}
            >
              {saveLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const {
    trigger,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    destructive = false,
    pending = false,
  } = props;

  return (
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
};
