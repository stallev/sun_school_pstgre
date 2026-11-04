"use client";

import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";

type AuditTechnicalRecordProps = {
  term: string;
  hint: string;
  hintAriaLabel: string;
  json: string | null;
};

export const AuditTechnicalRecord = ({ term, hint, hintAriaLabel, json }: AuditTechnicalRecordProps) => {
  if (!json) return null;
  return (
    <details className="mt-2 text-sm text-muted">
      <summary className="cursor-pointer text-ink-2 hover:text-ink">
        <TermLabel
          term={nonEmptyTerm(term)}
          hint={hint}
          ariaLabel={hintAriaLabel}
          popoverSide="top"
        />
      </summary>
      <pre className="mt-2 max-h-48 overflow-auto break-all rounded-lg border border-line bg-paper p-3 font-mono text-sm text-ink-2">
        {json}
      </pre>
    </details>
  );
};
