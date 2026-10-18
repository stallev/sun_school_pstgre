import { DELETION_PLAN_ACTION, type DeletionPlan } from "@sunschool/domain";
import { ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type DeletionPlanViewProps = {
  plan: DeletionPlan;
  messages: AdminMessages["deletions"];
};

export const DeletionPlanView = ({ plan, messages }: DeletionPlanViewProps) => {
  const deleteItems = plan.items.filter(
    (item) => item.action === DELETION_PLAN_ACTION.DELETE && item.count > 0,
  );
  const anonymizeItems = plan.items.filter(
    (item) => item.action === DELETION_PLAN_ACTION.ANONYMIZE && item.count > 0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PlanColumn title={messages.planDelete} items={deleteItems} labels={messages.categoryLabels} />
        <PlanColumn title={messages.planAnonymize} items={anonymizeItems} labels={messages.categoryLabels} />
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
  title: string;
  items: DeletionPlan["items"];
  labels: Record<string, string>;
};

const PlanColumn = ({ title, items, labels }: PlanColumnProps) => (
  <div className="rounded-lg border border-line p-3">
    <SectionTitle>{title}</SectionTitle>
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
