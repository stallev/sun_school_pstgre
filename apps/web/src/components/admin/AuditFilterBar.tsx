"use client";

import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { FormSelect } from "@/components/ui/form-select";
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
  <form
    method="get"
    action="/audit"
    className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-3"
  >
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
      <FormSelect
        id="audit-actor"
        name="actor"
        defaultValue={values.actor}
        placeholder={labels.all}
        options={actorOptions.map((option) => ({ value: option.userId, label: option.label }))}
        triggerClassName="max-w-none"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="audit-entity-type">{labels.entityType}</Label>
      <FormSelect
        id="audit-entity-type"
        name="entityType"
        defaultValue={values.entityType}
        placeholder={labels.all}
        options={Object.values(AUDIT_ENTITY_TYPE).map((type) => ({
          value: type,
          label: labels.entityTypeLabels[type] ?? type,
        }))}
        triggerClassName="max-w-none"
      />
    </div>
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="audit-action">{labels.action}</Label>
      <FormSelect
        id="audit-action"
        name="action"
        defaultValue={values.action}
        placeholder={labels.all}
        options={Object.values(AUDIT_ACTION).map((action) => ({
          value: action,
          label: labels.actionLabels[action] ?? action,
        }))}
        triggerClassName="max-w-none"
      />
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
