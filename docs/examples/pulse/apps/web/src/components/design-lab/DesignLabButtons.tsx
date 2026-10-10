import { SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import {
  BUTTON_MATRIX_SIZES,
  BUTTON_STATES,
  BUTTON_VARIANTS,
} from "@/lib/design-lab/matrices";

export function DesignLabButtons() {
  return (
    <DesignLabSection id="buttons" title="L2 — Buttons">
      <div className="space-y-10">
        {BUTTON_VARIANTS.map((variant) => (
          <div key={variant}>
            <VariantLabel>{variant}</VariantLabel>
            <div className="flex flex-wrap gap-3">
              {BUTTON_MATRIX_SIZES.map((size) =>
                BUTTON_STATES.map((state) => {
                  const label = `${size} / ${state}`;
                  const isIcon = size === "icon";
                  return (
                    <div key={`${size}-${state}`} className="space-y-1">
                      <VariantLabel>{label}</VariantLabel>
                      <Button
                        variant={variant}
                        size={size}
                        disabled={state === "disabled"}
                        loading={state === "loading"}
                        aria-label={isIcon ? "Settings" : undefined}
                      >
                        {isIcon ? (
                          <SettingsIcon aria-hidden />
                        ) : variant === "link" ? (
                          "Link action"
                        ) : (
                          "Button"
                        )}
                      </Button>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
    </DesignLabSection>
  );
}
