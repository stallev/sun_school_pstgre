import { SearchIcon } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VariantLabel } from "@/components/design-lab/DesignLabSection";
import {
  FORM_INPUT_SIZES,
  FORM_INPUT_STATES,
} from "@/lib/design-lab/matrices";

type InputStateDemoProps = {
  size: (typeof FORM_INPUT_SIZES)[number];
  state: (typeof FORM_INPUT_STATES)[number];
};

function InputStateDemo({ size, state }: InputStateDemoProps) {
  const isSearch = size === "search";
  const invalid = state === "error";

  return (
    <div>
      <VariantLabel>
        {size} / {state}
      </VariantLabel>
      <Field data-invalid={invalid || undefined}>
        <FieldLabel htmlFor={`input-${size}-${state}`}>
          {isSearch ? "Search" : "Label"}
        </FieldLabel>
        {isSearch ? (
          <div className="relative">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground"
            />
            <Input
              id={`input-${size}-${state}`}
              size="search"
              placeholder="Search by name or specialty"
              disabled={state === "disabled"}
              aria-invalid={invalid || undefined}
            />
          </div>
        ) : (
          <Input
            id={`input-${size}-${state}`}
            size={size === "compact" ? "compact" : "default"}
            placeholder="e.g. Morning stretch"
            disabled={state === "disabled"}
            aria-invalid={invalid || undefined}
            className={size === "compact" ? "md:max-w-[300px]" : undefined}
          />
        )}
        {invalid ? (
          <FieldError>This field is required.</FieldError>
        ) : (
          <FieldDescription>Optional helper text.</FieldDescription>
        )}
      </Field>
    </div>
  );
}

export function DesignLabInputMatrix() {
  return (
    <div>
      <VariantLabel>Input — size × state</VariantLabel>
      <div className="grid gap-6 sm:grid-cols-2">
        {FORM_INPUT_SIZES.flatMap((size) =>
          FORM_INPUT_STATES.map((state) => (
            <InputStateDemo key={`${size}-${state}`} size={size} state={state} />
          )),
        )}
      </div>
    </div>
  );
}
