"use client";

import { useState, type ReactElement, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  /** When set, the confirm button stays disabled until the user types this phrase (case-insensitive). */
  confirmPhrase?: string;
  confirmPhraseLabel?: string;
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

  return <ConfirmDialogConfirm {...props} />;
};

const isPhraseTyped = (typed: string, phrase: string | undefined): boolean =>
  phrase === undefined || typed.trim().toLocaleLowerCase() === phrase.trim().toLocaleLowerCase();

const ConfirmDialogConfirm = ({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  pending = false,
  confirmPhrase,
  confirmPhraseLabel,
}: ConfirmDialogConfirmProps) => {
  const [typed, setTyped] = useState("");
  const phraseMatches = isPhraseTyped(typed, confirmPhrase);

  return (
    <Dialog onOpenChange={() => setTyped("")}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {confirmPhrase !== undefined ? (
          <label className="grid gap-label text-sm">
            <span>{confirmPhraseLabel}</span>
            <Input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" />
          </label>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            {cancelLabel}
          </DialogClose>
          <Button
            variant={destructive ? "destructive-solid" : "default"}
            disabled={pending || !phraseMatches}
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
