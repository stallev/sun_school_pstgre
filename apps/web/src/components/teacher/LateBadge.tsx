import { ContentText } from "@/components/atoms";

type LateBadgeProps = {
  label: string;
};

/** Late submission marker — text + colour (flow spec §5.3, D7). */
export const LateBadge = ({ label }: LateBadgeProps) => (
  <ContentText className="text-sm text-warn" aria-label={label}>
    {label}
  </ContentText>
);
