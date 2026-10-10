import { ContentText } from "@/components/atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import { PulseCardLabFixture } from "@/components/design-lab/PulseCardLabFixture";
import {
  PULSECARD_STATES,
  PULSECARD_VARIANTS,
} from "@/lib/design-lab/matrices";
import { cn } from "@/lib/utils";

export function DesignLabCards() {
  return (
    <DesignLabSection id="cards" title="L2 — Cards">
      <div className="space-y-10">
        {PULSECARD_VARIANTS.map((variant) => (
          <div key={variant}>
            <VariantLabel>PulseCard / {variant}</VariantLabel>
            <div
              className={cn(
                "grid gap-4 @3xl/design-lab:grid-cols-2",
                variant === "elevated" && "gap-6",
              )}
            >
              {PULSECARD_STATES.map((state) => {
                const interactive = state !== "muted";
                const label = `${state}${interactive ? " · interactive" : ""}`;

                return (
                  <div key={`${variant}-${state}`} className="space-y-2">
                    <VariantLabel>{label}</VariantLabel>
                    <PulseCardLabFixture
                      variant={variant}
                      state={state}
                      interactive={interactive}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <VariantLabel>shadcn Card primitives</VariantLabel>
          <Card>
            <CardHeader>
              <CardTitle>Session summary</CardTitle>
              <CardDescription>Dialog / Sheet compatible slots</CardDescription>
            </CardHeader>
            <CardContent>
              <ContentText variant="bodyMuted" as="p">
                CardContent area for forms and detail panels.
              </ContentText>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DesignLabSection>
  );
}
