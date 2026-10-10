"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { type OnboardingServiceRow } from "@pulse/domain";

import { saveOnboardingStep4Action } from "@/actions/trainer/save-onboarding-step-4";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type TrainerOnboardingServicesStepProps = {
  initialServices: OnboardingServiceRow[];
  onBack: () => void;
  onNext: () => void;
};

function emptyService(): OnboardingServiceRow {
  return {
    name: "",
    durationMinutes: 60,
    priceCents: 5000,
  };
}

export function TrainerOnboardingServicesStep({  initialServices,
  onBack,
  onNext,
}: TrainerOnboardingServicesStepProps) {
  const messages = useMessages();

  const [rows, setRows] = useState<OnboardingServiceRow[]>(
    initialServices.length > 0 ? initialServices : [emptyService()],
  );
  const [isPending, startTransition] = useTransition();

  const updateRow = (index: number, patch: Partial<OnboardingServiceRow>) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const saveAndContinue = (services: OnboardingServiceRow[]) => {
    startTransition(async () => {
      const result = await saveOnboardingStep4Action({ services });
      if (!result?.ok) {
        toast.error(result?.message ?? messages.trainer.onboarding.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        return;
      }
      onNext();
    });
  };

  const handleNext = () => {
    const services = rows.filter((row) => row.name.trim().length > 0);
    saveAndContinue(services);
  };

  const handleSkip = () => {
    saveAndContinue([]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-border p-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{messages.trainer.onboarding.serviceNameLabel}</FieldLabel>
                <Input
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                  disabled={isPending}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{messages.trainer.onboarding.serviceDurationLabel}</FieldLabel>
                  <Input
                    type="number"
                    min={15}
                    value={row.durationMinutes}
                    onChange={(event) =>
                      updateRow(index, { durationMinutes: Number(event.target.value) })
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel>{messages.trainer.onboarding.servicePriceLabel}</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(row.priceCents / 100)}
                    onChange={(event) =>
                      updateRow(index, {
                        priceCents: Math.round(Number(event.target.value) * 100),
                      })
                    }
                    disabled={isPending}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>{messages.trainer.onboarding.serviceDescriptionLabel}</FieldLabel>
                <Textarea
                  value={row.description ?? ""}
                  onChange={(event) => updateRow(index, { description: event.target.value })}
                  disabled={isPending}
                  rows={2}
                />
              </Field>
            </FieldGroup>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((current) => [...current, emptyService()])}
          disabled={isPending}
        >
          <PlusIcon aria-hidden className="size-4" />
          {messages.trainer.onboarding.addService}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          disabled={isPending}
          aria-busy={isPending}
        >
          {messages.trainer.onboarding.skipServices}
        </Button>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
          {messages.trainer.onboarding.back}
        </Button>
        <Button type="button" className="flex-1" onClick={handleNext} disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              {messages.trainer.onboarding.nextSaving}
            </>
          ) : (
            messages.trainer.onboarding.next
          )}
        </Button>
      </div>
    </div>
  );
}
