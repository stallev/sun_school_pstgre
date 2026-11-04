import { DELETION_PLAN_ACTION, type DeletionPlan } from "@sunschool/domain";
import { ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type DeletionPlanViewProps = {
  plan: DeletionPlan;
  messages: AdminMessages["deletions"];
  deleteHint: HintTerm;
  anonymizeHint: HintTerm;
};

export const DeletionPlanView = ({
  plan,
  messages,
  deleteHint,
  anonymizeHint,
}: DeletionPlanViewProps) => {
  const deleteItems = plan.items.filter(
    (item) => item.action === DELETION_PLAN_ACTION.DELETE && item.count > 0,
  );
  const anonymizeItems = plan.items.filter(
    (item) => item.action === DELETION_PLAN_ACTION.ANONYMIZE && item.count > 0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PlanColumn
          titleHint={deleteHint}
          items={deleteItems}
          labels={messages.categoryLabels}
        />
        <PlanColumn
          titleHint={anonymizeHint}
          items={anonymizeItems}
          labels={messages.categoryLabels}
        />
      </div>
      {plan.warnings.map((code) => (
        <Banner key={code} tone="warning" title={messages.warningTitle}>
          {messages.warningLabels[code] ?? code}
        </Banner>
      ))}
    </div>
  );
};

type PlanColumnProps = {
  titleHint: HintTerm;
  items: DeletionPlan["items"];
  labels: Record<string, string>;
};

const PlanColumn = ({ titleHint, items, labels }: PlanColumnProps) => (
  <div className="rounded-lg border border-line p-3">
    <SectionTitle>
      <TermLabel
        term={nonEmptyTerm(titleHint.term)}
        hint={titleHint.hint}
        ariaLabel={titleHint.term}
        popoverSide="top"
      />
    </SectionTitle>
    {items.length === 0 ? (
      <ContentText tone="muted" className="mt-1.5 text-sm">—</ContentText>
    ) : (
      <ul className="mt-1.5 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.category} className="flex justify-between gap-3">
            <span className="text-ink-2">{labels[item.category] ?? item.category}</span>
            <span className="tabular-nums text-ink">{item.count}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
