"use client";

import { Button } from "@/components/ui/button";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TermHint } from "@/components/ui/term-hint";
import { CONTROL_HEIGHTS } from "@/lib/design-lab/tokens";
import { LAB_TEXT } from "@/lib/design-lab/fixtures";
import { MatrixCell } from "./MatrixCell";

const OPTIONS = [
  { value: "a", label: "Ковчег" },
  { value: "b", label: "Маяк" },
];

type Size = "default" | "compact";

const FieldTrio = ({ size, prefix }: { size: Size; prefix: string }) => (
  <div className="grid gap-3 sm:grid-cols-3">
    <Input size={size} aria-label={`${prefix} input`} placeholder="Input" />
    <FormSelect size={size} aria-label={`${prefix} select`} options={OPTIONS} placeholder="Select" />
    <FormDateField
      size={size}
      name={`${prefix}-date`}
      locale="ru"
      calendarAriaLabel={LAB_TEXT.calendarOpen}
    />
  </div>
);

/** Design Lab «Field heights» (design_system_lab_spec §5.3а, ADR-022 §4.3). */
export const FieldHeights = () => (
  <div className="space-y-3">
    <ul className="flex flex-wrap gap-chip text-sm text-muted tabular-nums">
      {CONTROL_HEIGHTS.map((height) => (
        <li key={height.variable} className="rounded-lg border border-line bg-surface px-3 py-1">
          {height.variable}: {height.rem}rem · {height.px} px · {height.utility} — {height.role}
        </li>
      ))}
    </ul>
    <div className="grid gap-3 lg:grid-cols-2">
      <MatrixCell label="h-9 · 40,5 px (default)">
        <FieldTrio size="default" prefix="default" />
      </MatrixCell>
      <MatrixCell label="h-8 · 36 px (size=compact)">
        <FieldTrio size="compact" prefix="compact" />
      </MatrixCell>
      <MatrixCell label="Filter row: fields + button inheriting the field height (tops ±1 px)">
        <div className="flex flex-wrap items-end gap-stack">
          <Input aria-label="From" placeholder="С" className="w-28" />
          <Input aria-label="To" placeholder="По" className="w-28" />
          <Button type="button">Применить</Button>
        </div>
      </MatrixCell>
      <MatrixCell label="Compact filter row: Button size=compact">
        <div className="flex flex-wrap items-end gap-stack">
          <Input size="compact" aria-label="Actor" placeholder="Актор" className="w-28" />
          <FormSelect size="compact" aria-label="Type" options={OPTIONS} placeholder="Тип" triggerClassName="w-28" />
          <Button type="button" size="compact">Сбросить</Button>
        </div>
      </MatrixCell>
      <MatrixCell label="Labels with and without the hint icon — fields stay on one line (label min-h-5)">
        <div className="grid grid-cols-2 gap-stack">
          <div>
            <Label htmlFor="lab-h-a" className="mb-label">
              Термин
              <TermHint term="Термин" hint="Пояснение" ariaLabel="Что значит «Термин»" />
            </Label>
            <Input id="lab-h-a" className="max-w-none" />
          </div>
          <div>
            <Label htmlFor="lab-h-b" className="mb-label">Без значка</Label>
            <Input id="lab-h-b" className="max-w-none" />
          </div>
        </div>
      </MatrixCell>
      <MatrixCell label="touch h-11 (primary action below md)">
        <Button type="button" size="touch">Сохранить</Button>
      </MatrixCell>
    </div>
  </div>
);
