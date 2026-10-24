import { AlertText } from "@/components/atoms/AlertText";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LAB_TEXT } from "@/lib/design-lab/fixtures";
import { FIELD_STATES } from "@/lib/design-lab/matrices";
import { MatrixCell } from "./MatrixCell";

export const FieldMatrix = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {FIELD_STATES.map((state) => {
      const id = `lab-field-${state.id}`;
      const invalid = state.id === "invalid";
      return (
        <MatrixCell key={state.id} label={state.label}>
          <div className="space-y-1.5">
            <Label htmlFor={id}>
              {LAB_TEXT.fieldLabel}
            </Label>
            <Input
              id={id}
              placeholder={LAB_TEXT.fieldPlaceholder}
              disabled={state.id === "disabled"}
              aria-invalid={invalid || undefined}
              aria-busy={state.id === "pending" || undefined}
              autoFocus={false}
              className={state.id === "focus" ? "border-cobalt-ink" : undefined}
            />
            {invalid ? <AlertText>{LAB_TEXT.fieldError}</AlertText> : null}
          </div>
        </MatrixCell>
      );
    })}
    <MatrixCell label="textarea">
      <div className="space-y-1.5">
        <Label htmlFor="lab-textarea">
          {LAB_TEXT.fieldLabel}
        </Label>
        <Textarea id="lab-textarea" placeholder={LAB_TEXT.fieldPlaceholder} />
      </div>
    </MatrixCell>
  </div>
);
