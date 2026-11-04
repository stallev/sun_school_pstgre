"use client";

import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type ProfileLoginMethodsProps = {
  sectionTitle: string;
  loginMethodsHint: HintTerm;
  children: ReactNode;
  footer?: ReactNode;
};

export const ProfileLoginMethods = ({
  sectionTitle,
  loginMethodsHint,
  children,
  footer,
}: ProfileLoginMethodsProps) => (
  <section className="flex h-full flex-col space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
    <TermLabel
      term={nonEmptyTerm(sectionTitle)}
      hint={loginMethodsHint.hint}
      ariaLabel={loginMethodsHint.term}
      className="font-display text-lg font-medium text-ink"
    />
    <div className="min-h-0 flex-1 space-y-4">{children}</div>
    {footer ? <ContentText tone="secondary" className="text-sm">{footer}</ContentText> : null}
  </section>
);
