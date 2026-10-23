"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type AchievementModeOffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
  messages: TeacherAchievementsMessages;
};

export const AchievementModeOffDialog = ({
  open,
  onOpenChange,
  pending,
  onConfirm,
  messages,
}: AchievementModeOffDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent closeLabel={messages.closeLabel}>
      <DialogHeader>
        <DialogTitle>{messages.modeOffDialogTitle}</DialogTitle>
      </DialogHeader>
      <ul className="mt-4 space-y-2 text-sm text-ink-2">
        <li>— {messages.modeOffBullet1}</li>
        <li>— {messages.modeOffBullet2}</li>
        <li>— {messages.modeOffBullet3}</li>
      </ul>
      <DialogFooter className="mt-5 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
          {messages.cancel}
        </Button>
        <Button type="button" variant="outline" disabled={pending} aria-busy={pending} onClick={onConfirm}>
          {pending ? messages.saving : messages.modeOffConfirm}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
