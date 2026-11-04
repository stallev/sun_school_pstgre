import { ContentText } from "@/components/atoms/ContentText";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";

type AnalyticsKpiMetricHeadingProps = {
  label: string;
  glossary?: GlossaryTerm;
  termHintAriaLabel?: string;
  className?: string;
};

export const AnalyticsKpiMetricHeading = ({
  label,
  glossary,
  termHintAriaLabel,
  className,
}: AnalyticsKpiMetricHeadingProps) => (
  <ContentText className={className ?? "text-sm text-muted"}>
    {glossary && termHintAriaLabel ? (
      <TermLabel
        term={nonEmptyTerm(label)}
        hint={glossary.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: glossary.term })}
      />
    ) : (
      label
    )}
  </ContentText>
);
