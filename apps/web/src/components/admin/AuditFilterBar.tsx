"use client";

import { useState } from "react";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomLink } from "@/components/ui/custom-link";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormSelect } from "@/components/ui/form-select";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { FormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { Label } from "@/components/ui/label";

type ActorOption = { userId: string; label: string };

type AuditFilterBarProps = {
  values: {
    from: string;
    to: string;
    actor: string;
    entityType: string;
    action: string;
    showSystem: boolean;
  };
  actorOptions: ActorOption[];
  dateFieldCopy: FormDateFieldCopy;
  labels: {
    from: string;
    to: string;
    actor: string;
    entityType: string;
    action: string;
    all: string;
    submit: string;
    reset: string;
    showSystem: string;
    showSystemHint: string;
    showSystemHintAria: string;
    entityTypeHint: string;
    entityTypeHintAria: string;
    entityTypeLabels: Record<string, string>;
    actionLabels: Record<string, string>;
  };
};

export const AuditFilterBar = ({ values, actorOptions, dateFieldCopy, labels }: AuditFilterBarProps) => {
  const [showSystem, setShowSystem] = useState(values.showSystem);

  return (
  <form
    method="get"
    action="/audit"
    className="grid grid-cols-12 gap-x-stack gap-y-stack rounded-xl border border-line bg-surface p-card"
  >
    <div className="col-span-12 space-y-label md:col-span-4">
      <Label htmlFor="audit-from" className="min-h-5">{labels.from}</Label>
      <FormDateField
        id="audit-from"
        name="from"
        defaultValue={values.from}
        locale={dateFieldCopy.locale}
        calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
        className="max-w-none"
      />
    </div>
    <div className="col-span-12 space-y-label md:col-span-4">
      <Label htmlFor="audit-to" className="min-h-5">{labels.to}</Label>
      <FormDateField
        id="audit-to"
        name="to"
        defaultValue={values.to}
        locale={dateFieldCopy.locale}
        calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
        className="max-w-none"
      />
    </div>
    <div className="col-span-12 space-y-label md:col-span-4">
      <Label htmlFor="audit-actor" className="min-h-5">{labels.actor}</Label>
      <FormSelect
        id="audit-actor"
        name="actor"
        defaultValue={values.actor}
        placeholder={labels.all}
        options={actorOptions.map((option) => ({ value: option.userId, label: option.label }))}
        triggerClassName="max-w-none"
      />
    </div>
    <div className="col-span-12 space-y-label md:col-span-6">
      <Label htmlFor="audit-entity-type" className="min-h-5">
        <TermLabel
          term={nonEmptyTerm(labels.entityType)}
          hint={labels.entityTypeHint}
          ariaLabel={labels.entityTypeHintAria}
          popoverSide="top"
        />
      </Label>
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
    <div className="col-span-12 space-y-label md:col-span-6">
      <Label htmlFor="audit-action" className="min-h-5">{labels.action}</Label>
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
    <div className="col-span-12 flex flex-wrap items-center justify-between gap-x-stack gap-y-stack">
      <div className="flex items-center gap-chip">
        <Checkbox
          id="audit-show-system"
          checked={showSystem}
          onCheckedChange={(checked) => setShowSystem(checked === true)}
        />
        {showSystem ? <input type="hidden" name="showSystem" value="1" /> : null}
        <Label htmlFor="audit-show-system" className="font-normal">
          <TermLabel
            term={nonEmptyTerm(labels.showSystem)}
            hint={labels.showSystemHint}
            ariaLabel={labels.showSystemHintAria}
            popoverSide="top"
          />
        </Label>
      </div>
      <div className="flex flex-wrap items-center gap-chip">
        <Button type="submit">{labels.submit}</Button>
        <CustomLink
          href="/audit"
          className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-card text-sm hover:bg-paper"
        >
          {labels.reset}
        </CustomLink>
      </div>
    </div>
  </form>
  );
};
