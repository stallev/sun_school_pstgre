import { cn } from "@/lib/utils";

const TIER_CLASS = ["bg-tier-1", "bg-tier-2", "bg-tier-3"] as const;

type AchievementTierDotProps = {
  tierIndex: number;
  className?: string;
};

export const AchievementTierDot = ({ tierIndex, className }: AchievementTierDotProps) => (
  <span
    aria-hidden
    className={cn("inline-block size-2.5 shrink-0 rounded-full", TIER_CLASS[tierIndex] ?? "bg-line", className)}
  />
);
