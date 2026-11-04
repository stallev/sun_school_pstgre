import { ContentText } from "@/components/atoms/ContentText";
import { TermHint } from "@/components/ui/term-hint";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";

type AnalyticsKpiMetricHeadingProps = {
  label: string;
  glossary?: GlossaryTerm;
  className?: string;
};

export const AnalyticsKpiMetricHeading = ({
  label,
  glossary,
  className,
}: AnalyticsKpiMetricHeadingProps) => (
  <ContentText className={className ?? "text-sm text-muted"}>
    {label}
    {glossary ? (
      <>
        {" "}
        <TermHint term={glossary.term} hint={glossary.hint} />
      </>
    ) : null}
  </ContentText>
);
