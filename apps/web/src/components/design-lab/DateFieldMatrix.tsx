"use client";

import { useState } from "react";
import { DateField } from "@/components/ui/date-field";
import { Label } from "@/components/ui/label";
import { LAB_TEXT } from "@/lib/design-lab/fixtures";
import { MatrixCell } from "./MatrixCell";

export const DateFieldMatrix = () => {
  const [value, setValue] = useState("2026-01-15");
  const [empty, setEmpty] = useState("");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MatrixCell label="DateField — value">
        <div className="space-y-1.5">
          <Label htmlFor="lab-date-value">{LAB_TEXT.fieldLabel}</Label>
          <DateField
            id="lab-date-value"
            locale="ru"
            calendarAriaLabel={LAB_TEXT.calendarOpen}
            value={value}
            onChange={setValue}
            min="2026-01-01"
            max="2026-12-31"
          />
        </div>
      </MatrixCell>
      <MatrixCell label="DateField — empty / disabled / invalid">
        <div className="space-y-3">
          <DateField
            locale="ru"
            calendarAriaLabel={LAB_TEXT.calendarOpen}
            value={empty}
            onChange={setEmpty}
          />
          <DateField
            locale="ru"
            calendarAriaLabel={LAB_TEXT.calendarOpen}
            value="2026-06-01"
            onChange={() => undefined}
            disabled
          />
          <DateField
            locale="ru"
            calendarAriaLabel={LAB_TEXT.calendarOpen}
            value="2026-06-01"
            onChange={() => undefined}
            invalid
          />
        </div>
      </MatrixCell>
    </div>
  );
};
