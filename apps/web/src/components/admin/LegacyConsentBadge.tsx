import { StatusText } from "@/components/ui/status-text";

type LegacyConsentBadgeProps = {
  isOverdue: boolean;
  daysRemaining: number;
  legacyLabel: string;
  overdueLabel: string;
  daysRemainingLabel: string;
};

export const LegacyConsentBadge = ({
  isOverdue,
  daysRemaining,
  legacyLabel,
  overdueLabel,
  daysRemainingLabel,
}: LegacyConsentBadgeProps) => {
  const detail = isOverdue
    ? overdueLabel
    : daysRemainingLabel.replace("{days}", String(Math.max(daysRemaining, 0)));

  return (
    <StatusText tone={isOverdue ? "warn" : "neutral"}>
      {legacyLabel} · {detail}
    </StatusText>
  );
};
