"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  DEFAULT_SCHEDULE_END_TIME,
  DEFAULT_SCHEDULE_START_TIME,
  isScheduleIntervalValid,
  isValidScheduleTime,
} from "@/lib/trainer/format-schedule-time";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


import { ScheduleTimeInput } from "./ScheduleTimeInput.client";

export type AddIntervalFormProps = {
  formId: string;
  disabled?: boolean;
  onSubmit: (startTime: string, endTime: string) => void;
  onCancel: () => void;
  /** Mobile bottom sheet: paired fields, hint, footer rendered by parent */
  mobileSheet?: boolean;
};

type FieldErrors = {
  startTime?: string;
  endTime?: string;
};

export function AddIntervalForm({  formId,
  disabled = false,
  onSubmit,
  onCancel,
  mobileSheet = false,
}: AddIntervalFormProps) {
  const messages = useMessages();

  const startId = useId();
  const endId = useId();
  const [startTime, setStartTime] = useState(DEFAULT_SCHEDULE_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_SCHEDULE_END_TIME);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (!isValidScheduleTime(startTime)) {
      nextErrors.startTime = messages.trainer.schedule.errors.invalidStartTime;
    }

    if (!isValidScheduleTime(endTime)) {
      nextErrors.endTime = messages.trainer.schedule.errors.invalidEndTime;
    }

    if (
      !nextErrors.startTime &&
      !nextErrors.endTime &&
      !isScheduleIntervalValid(startTime, endTime)
    ) {
      nextErrors.endTime = messages.trainer.schedule.errors.invalidInterval;
    }

    return nextErrors;
  }

  function focusFirstInvalid(errors: FieldErrors) {
    if (errors.startTime) {
      document.getElementById(startId)?.focus();
      return;
    }

    if (errors.endTime) {
      document.getElementById(endId)?.focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(nextErrors);
      return;
    }

    onSubmit(startTime, endTime);
    setFieldErrors({});
  }

  const fieldsGridClassName = mobileSheet
    ? "grid grid-cols-2 gap-3"
    : "grid gap-4 sm:grid-cols-2";

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-4">
        <div className={fieldsGridClassName}>
          <Field data-invalid={Boolean(fieldErrors.startTime)}>
            <FieldLabel htmlFor={startId}>
              {messages.trainer.schedule.startTimeLabel}
            </FieldLabel>
            <ScheduleTimeInput
              id={startId}
              value={startTime}
              onChange={(value) => {
                setStartTime(value);
                if (fieldErrors.startTime) {
                  setFieldErrors((current) => ({
                    ...current,
                    startTime: undefined,
                  }));
                }
              }}
              disabled={disabled}
              invalid={Boolean(fieldErrors.startTime)}
              aria-describedby={
                fieldErrors.startTime ? `${startId}-error` : undefined
              }
            />
            {fieldErrors.startTime ? (
              <FieldError id={`${startId}-error`}>
                {fieldErrors.startTime}
              </FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(fieldErrors.endTime)}>
            <FieldLabel htmlFor={endId}>
              {messages.trainer.schedule.endTimeLabel}
            </FieldLabel>
            <ScheduleTimeInput
              id={endId}
              value={endTime}
              onChange={(value) => {
                setEndTime(value);
                if (fieldErrors.endTime) {
                  setFieldErrors((current) => ({
                    ...current,
                    endTime: undefined,
                  }));
                }
              }}
              disabled={disabled}
              invalid={Boolean(fieldErrors.endTime)}
              aria-describedby={
                fieldErrors.endTime ? `${endId}-error` : undefined
              }
            />
            {fieldErrors.endTime ? (
              <FieldError id={`${endId}-error`}>{fieldErrors.endTime}</FieldError>
            ) : null}
          </Field>
        </div>
        {mobileSheet ? (
          <FieldDescription>{messages.trainer.schedule.timeFormatHint}</FieldDescription>
        ) : null}
      </FieldGroup>
      {mobileSheet ? null : (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={disabled}
          >
            {messages.trainer.schedule.cancel}
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={disabled}
            aria-busy={disabled}
          >
            {messages.trainer.schedule.addSlot}
          </Button>
        </div>
      )}
    </form>
  );
}
