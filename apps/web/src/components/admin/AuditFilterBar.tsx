import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActorOption = { userId: string; label: string };

type AuditFilterBarProps = {
  values: {
    from: string;
    to: string;
    actor: string;
    entityType: string;
    action: string;
  };
  actorOptions: ActorOption[];
  labels: {
    from: string;
    to: string;
    actor: string;
    entityType: string;
    action: string;
    all: string;
    submit: string;
    reset: string;
    entityTypeLabels: Record<string, string>;
    actionLabels: Record<string, string>;
  };
};

export const AuditFilterBar = ({ values, actorOptions, labels }: AuditFilterBarProps) => (
  <form method="get" action="/audit" className="grid gap-4 rounded-xl border border-line bg-surface p-4 md:grid-cols-2 lg:grid-cols-3">
    <div className="space-y-2">
      <Label htmlFor="audit-from">{labels.from}</Label>
      <Input id="audit-from" name="from" type="date" value={values.from} className="min-h-11" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="audit-to">{labels.to}</Label>
      <Input id="audit-to" name="to" type="date" value={values.to} className="min-h-11" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="audit-actor">{labels.actor}</Label>
      <select
        id="audit-actor"
        name="actor"
        defaultValue={values.actor}
        className="flex min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
      >
        <option value="">{labels.all}</option>
        {actorOptions.map((option) => (
          <option key={option.userId} value={option.userId}>{option.label}</option>
        ))}
      </select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="audit-entity-type">{labels.entityType}</Label>
      <select
        id="audit-entity-type"
        name="entityType"
        defaultValue={values.entityType}
        className="flex min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
      >
        <option value="">{labels.all}</option>
        {Object.values(AUDIT_ENTITY_TYPE).map((type) => (
          <option key={type} value={type}>{labels.entityTypeLabels[type] ?? type}</option>
        ))}
      </select>
    </div>
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="audit-action">{labels.action}</Label>
      <select
        id="audit-action"
        name="action"
        defaultValue={values.action}
        className="flex min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
      >
        <option value="">{labels.all}</option>
        {Object.values(AUDIT_ACTION).map((action) => (
          <option key={action} value={action}>{labels.actionLabels[action] ?? action}</option>
        ))}
      </select>
    </div>
    <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
      <Button type="submit" className="min-h-11">{labels.submit}</Button>
      <CustomLink
        href="/audit"
        className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm hover:bg-paper"
      >
        {labels.reset}
      </CustomLink>
    </div>
  </form>
);
