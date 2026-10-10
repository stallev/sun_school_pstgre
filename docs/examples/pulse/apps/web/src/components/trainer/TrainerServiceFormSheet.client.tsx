"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { type CreateTrainerServiceInput } from "@pulse/domain";

import { createTrainerServiceAction } from "@/actions/trainer/create-trainer-service";
import { updateTrainerServiceAction } from "@/actions/trainer/update-trainer-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TrainerServiceForEdit } from "@/data/trainer/get-trainer-services-for-edit.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type TrainerServiceFormSheetProps = {
  open: boolean;
  service: TrainerServiceForEdit | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (service: TrainerServiceForEdit) => void;
};

type FormState = {
  name: string;
  durationMinutes: string;
  priceDollars: string;
  description: string;
};

function buildInitialForm(service: TrainerServiceForEdit | null): FormState {
  return {
    name: service?.name ?? "",
    durationMinutes: service ? String(service.durationMinutes) : "60",
    priceDollars: service ? String(Math.round(service.priceCents / 100)) : "50",
    description: service?.description ?? "",
  };
}

type TrainerServiceFormFieldsProps = {
  service: TrainerServiceForEdit | null;
  onClose: () => void;
  onSaved: (service: TrainerServiceForEdit) => void;
};

function TrainerServiceFormFields({
  service,
  onClose,
  onSaved,
}: TrainerServiceFormFieldsProps) {
  const messages = useMessages();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(service));
  const [isPending, startTransition] = useTransition();
  const isEditing = service !== null;

  const handleSave = () => {
    startTransition(async () => {
      const payload: CreateTrainerServiceInput = {
        name: form.name.trim(),
        durationMinutes: Number(form.durationMinutes),
        priceCents: Math.round(Number(form.priceDollars) * 100),
        description: form.description.trim() || undefined,
      };

      const result = isEditing
        ? await updateTrainerServiceAction({ ...payload, id: service.id })
        : await createTrainerServiceAction(payload);

      if (!result.ok) {
        toast.error(result.message ?? messages.trainer.services.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        return;
      }

      toast.success(messages.trainer.services.saved, {
        duration: PRODUCT_TOAST_DURATION_MS,
      });

      onSaved({
        id: result.data.serviceId,
        name: payload.name,
        description: payload.description ?? null,
        durationMinutes: payload.durationMinutes,
        priceCents: payload.priceCents,
        currency: service?.currency ?? "USD",
        isActive: service?.isActive ?? true,
        sortOrder: service?.sortOrder ?? 0,
      });
      onClose();
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditing
            ? messages.trainer.services.editService
            : messages.trainer.services.newService}
        </DialogTitle>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="service-name">
            {messages.trainer.onboarding.serviceNameLabel}
          </FieldLabel>
          <Input
            id="service-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            disabled={isPending}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="service-duration">
              {messages.trainer.onboarding.serviceDurationLabel}
            </FieldLabel>
            <Input
              id="service-duration"
              type="number"
              min={15}
              max={480}
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, durationMinutes: event.target.value }))
              }
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="service-price">
              {messages.trainer.onboarding.servicePriceLabel}
            </FieldLabel>
            <Input
              id="service-price"
              type="number"
              min={0}
              value={form.priceDollars}
              onChange={(event) =>
                setForm((current) => ({ ...current, priceDollars: event.target.value }))
              }
              disabled={isPending}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="service-description">
            {messages.trainer.onboarding.serviceDescriptionLabel}
          </FieldLabel>
          <Textarea
            id="service-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            disabled={isPending}
            rows={3}
          />
        </Field>
      </FieldGroup>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {messages.trainer.services.cancel}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              {messages.trainer.services.saving}
            </>
          ) : (
            messages.trainer.services.save
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function TrainerServiceFormSheet({  open,
  service,
  onOpenChange,
  onSaved,
}: TrainerServiceFormSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <TrainerServiceFormFields
            key={service?.id ?? "new"}
            service={service}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
