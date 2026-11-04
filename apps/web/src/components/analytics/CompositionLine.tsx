import { ContentText } from "@/components/atoms/ContentText";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CompositionLineProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
  compositionHint: HintTerm;
  termHintAriaLabel: string;
};

export const CompositionLine = ({ snapshot, messages, compositionHint, termHintAriaLabel }: CompositionLineProps) => {
  const { A, B, C, D } = snapshot.sampleCounts;
  return (
    <ContentText className="mt-2 mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-ink-2">
      <TermLabel
        term={nonEmptyTerm(compositionHint.term)}
        hint={compositionHint.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: compositionHint.term })}
      />
      <span aria-hidden>:</span>{" "}
      <span className="font-bold text-ink">{messages.sampleLayerRegularly}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{A}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerRarely}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{B}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerInactive}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{C}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerNoChecks}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{D}</span>
    </ContentText>
  );
};
