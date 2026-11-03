import { ContentText } from "@/components/atoms";

type LateBadgeProps = {
  label: string;
  /** `ink-2` instead of `warn` on gold lesson leader rows (UX-03 D-16). */
  plain?: boolean;
};

/** Late submission marker — text + colour (flow spec §5.3, D7). */
export const LateBadge = ({ label, plain = false }: LateBadgeProps) => (
  <ContentText className={plain ? "text-sm text-ink-2" : "text-sm text-warn"} aria-label={label}>
    {label}
  </ContentText>
);
