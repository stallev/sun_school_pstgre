"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerField } from "@/components/ui/DatePickerField.client";
import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import { DesignLabInputMatrix } from "@/components/design-lab/DesignLabInputFixture";
import { ROLE_TILE_OPTIONS } from "@/lib/design-lab/matrices";

export function DesignLabForms() {
  const [role, setRole] = useState("client");
  const [terms, setTerms] = useState(false);
  const [serviceActive, setServiceActive] = useState(true);
  const [message, setMessage] = useState("");

  return (
    <DesignLabSection id="forms" title="L2 — Forms">
      <div className="space-y-10">
        <DesignLabInputMatrix />

        <div>
          <VariantLabel>Textarea — with counter</VariantLabel>
          <Field className="max-w-xl">
            <FieldLabel htmlFor="lab-message">Message to trainer</FieldLabel>
            <Textarea
              id="lab-message"
              rows={3}
              maxLength={500}
              placeholder="Share your goals, constraints, experience…"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="text-right font-mono text-[11px] text-subtle-foreground">
              {message.length}/500
            </p>
          </Field>
        </div>

        <div>
          <VariantLabel>Checkbox — terms</VariantLabel>
          <Field orientation="horizontal">
            <Checkbox
              id="lab-terms"
              checked={terms}
              onCheckedChange={(value) => setTerms(value === true)}
            />
            <FieldContent>
              <FieldLabel htmlFor="lab-terms">I agree to the Trainer Terms</FieldLabel>
              <FieldDescription>Required before submitting your application.</FieldDescription>
            </FieldContent>
          </Field>
        </div>

        <div>
          <VariantLabel>Radio — role tiles</VariantLabel>
          <FieldSet>
            <FieldLegend variant="label">Register as</FieldLegend>
            <RadioGroup
              value={role}
              onValueChange={setRole}
              className="grid grid-cols-2 gap-2"
            >
              {ROLE_TILE_OPTIONS.map((option) => (
                <RadioGroupItem
                  key={option.value}
                  value={option.value}
                  variant="tile"
                  id={`role-${option.value}`}
                >
                  {option.label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </FieldSet>
        </div>

        <div>
          <VariantLabel>Switch — service active</VariantLabel>
          <Field orientation="horizontal">
            <FieldContent className="flex-1">
              <FieldTitle>Morning HIIT</FieldTitle>
              <FieldDescription>Visible in catalog when active.</FieldDescription>
            </FieldContent>
            <Switch
              checked={serviceActive}
              onCheckedChange={setServiceActive}
              aria-label="Toggle service visibility"
            />
          </Field>
        </div>

        <div>
          <VariantLabel>DatePickerField — birth date (past only)</VariantLabel>
          <DatePickerField
            id="lab-birth-date"
            name="birthDate"
            label="Date of birth"
            placeholder="Select date"
            disableFuture
            className="max-w-xl"
          />
        </div>

        <div>
          <VariantLabel>DatePickerField — booking (future only)</VariantLabel>
          <DatePickerField
            id="lab-booking-date"
            name="bookingDate"
            label="Session date"
            placeholder="Pick a day"
            disablePast
            startMonth={new Date()}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
            className="max-w-xl"
          />
        </div>

        <div>
          <VariantLabel>DatePickerField — error</VariantLabel>
          <DatePickerField
            id="lab-date-error"
            name="dateError"
            label="Date of birth"
            placeholder="Select date"
            disableFuture
            invalid
            error="Enter a valid date of birth."
            className="max-w-xl"
          />
        </div>

        <div>
          <VariantLabel>DatePickerField — disabled</VariantLabel>
          <DatePickerField
            id="lab-date-disabled"
            name="dateDisabled"
            label="Date of birth"
            placeholder="Select date"
            defaultValue="1990-06-15"
            disableFuture
            disabled
            className="max-w-xl"
          />
        </div>

        <div>
          <VariantLabel>L3 — payment row (2-col)</VariantLabel>
          <div className="grid max-w-xl grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="lab-expiry">Expiry</FieldLabel>
              <Input id="lab-expiry" placeholder="MM/YY" defaultValue="12/27" />
            </Field>
            <Field>
              <FieldLabel htmlFor="lab-cvc">CVC</FieldLabel>
              <Input id="lab-cvc" placeholder="123" defaultValue="123" />
            </Field>
          </div>
        </div>
      </div>
    </DesignLabSection>
  );
}
