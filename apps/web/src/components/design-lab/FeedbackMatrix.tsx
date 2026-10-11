"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/count-badge";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusText } from "@/components/ui/status-text";
import { LAB_TEXT } from "@/lib/design-lab/fixtures";
import { BADGE_VARIANTS, STATUS_TONES } from "@/lib/design-lab/matrices";
import { MatrixCell } from "./MatrixCell";

export const FeedbackMatrix = () => (
  <div className="grid gap-3 md:grid-cols-2">
    <MatrixCell label="Badge">
      <div className="flex flex-wrap gap-2">
        {BADGE_VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
    </MatrixCell>
    <MatrixCell label="CountBadge">
      <div className="flex items-center gap-2">
        <CountBadge>3</CountBadge>
        <CountBadge>12</CountBadge>
        <CountBadge>99+</CountBadge>
      </div>
    </MatrixCell>
    <MatrixCell label="StatusText (text + tone, never colour only)">
      <div className="flex flex-wrap gap-3">
        {STATUS_TONES.map((tone) => (
          <StatusText key={tone} tone={tone}>
            {tone}
          </StatusText>
        ))}
      </div>
    </MatrixCell>
    <MatrixCell label="Progress">
      <Progress value={60} aria-label="60%">
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </MatrixCell>
    <MatrixCell label="Skeleton">
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </MatrixCell>
    <MatrixCell label="Toast (Sonner)">
      <Button variant="outline" onClick={() => toast(LAB_TEXT.toast)}>
        {LAB_TEXT.toast}
      </Button>
    </MatrixCell>
  </div>
);
