import { ContentText } from "@/components/atoms/ContentText";
import { TermHint } from "@/components/ui/term-hint";
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
    {label}
    {glossary && termHintAriaLabel ? (
      <>
        {" "}
        <TermHint
          term={glossary.term}
          hint={glossary.hint}
          ariaLabel={fillMessage(termHintAriaLabel, { term: glossary.term })}
        />
      </>
    ) : null}
  </ContentText>
);
