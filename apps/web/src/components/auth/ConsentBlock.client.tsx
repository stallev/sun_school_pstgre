"use client";

import { useState } from "react";
import { ContentText, SectionTitle } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { useAuthMessages } from "@/components/auth/auth-messages-provider.client";

type ConsentBlockProps = {
  consentVersion: string;
  summaryBullets: string[];
  fullTextParagraphs: string[];
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
};

export const ConsentBlock = ({
  consentVersion,
  summaryBullets,
  fullTextParagraphs,
  checked,
  onCheckedChange,
  disabled = false,
}: ConsentBlockProps) => {
  const messages = useAuthMessages();
  const [disclosureOpen, setDisclosureOpen] = useState(false);

  return (
    <section className="space-y-3" aria-labelledby="consent-heading">
      <SectionTitle id="consent-heading">{messages.register.stepConsent}</SectionTitle>
      <ul className="list-disc space-y-1 pl-5 text-ink-2">
        {summaryBullets.map((item) => (
          <li key={item}>
            <ContentText>{item}</ContentText>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="text-cobalt-ink text-sm underline-offset-4 hover:underline"
        aria-expanded={disclosureOpen}
        onClick={() => setDisclosureOpen((open) => !open)}
      >
        {disclosureOpen ? messages.register.hideFullConsent : messages.register.showFullConsent} ({consentVersion})
      </button>
      {disclosureOpen ? (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
          {fullTextParagraphs.map((paragraph) => (
            <ContentText key={paragraph}>{paragraph}</ContentText>
          ))}
          <CustomLink href="/privacy">{messages.login.privacyLink}</CustomLink>
        </div>
      ) : null}
      <Field orientation="horizontal" className="items-start gap-3">
        <Checkbox
          id="consentAccepted"
          name="consentAccepted"
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <FieldLabel htmlFor="consentAccepted" className="font-normal leading-snug">
          {messages.register.consentChildrenNote}{" "}
          <CustomLink href="/privacy">{messages.login.privacyLink}</CustomLink>
        </FieldLabel>
      </Field>
    </section>
  );
};
