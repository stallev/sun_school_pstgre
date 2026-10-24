"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loadManualAwardEvidenceAction } from "@/actions/teacher-achievements";
import { ContentText } from "@/components/atoms/ContentText";
import { Checkbox } from "@/components/ui/checkbox";
import type { ManualAwardEvidenceOption } from "@/lib/achievements/manual-award-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { cn } from "@/lib/utils";

type ManualAwardEvidencePickerProps = {
  pupilId: string;
  achievementId: string;
  tier: number;
  academicYearId: string;
  evidenceNeed: number;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  selectedChecks: Set<string>;
  onSelectedChecksChange: (next: Set<string>) => void;
  disabled?: boolean;
};

export const ManualAwardEvidencePicker = ({
  pupilId,
  achievementId,
  tier,
  academicYearId,
  evidenceNeed,
  messages,
  dictionaries,
  formError,
  selectedChecks,
  onSelectedChecksChange,
  disabled,
}: ManualAwardEvidencePickerProps) => {
  const [evidence, setEvidence] = useState<ManualAwardEvidenceOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadManualAwardEvidenceAction({
      pupilId,
      achievementId,
      tier,
      academicYearId,
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        const message = result.message
          ? resolveMessageKey(dictionaries, result.message)
          : formError;
        toast.error(message, { duration: PRODUCT_TOAST_DURATION_MS });
        setEvidence([]);
        onSelectedChecksChange(new Set());
        return;
      }
      setEvidence(result.data.options);
      onSelectedChecksChange(
        new Set(result.data.options.filter((row) => row.suggested).map((row) => row.checkId)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    pupilId,
    achievementId,
    tier,
    academicYearId,
    dictionaries,
    formError,
    onSelectedChecksChange,
  ]);

  if (evidenceNeed === 0) return null;

  const selectedCount = selectedChecks.size;
  const evidenceOk = selectedCount >= evidenceNeed;
  const loading = evidence === null;

  const toggleCheck = (checkId: string) => {
    const next = new Set(selectedChecks);
    if (next.has(checkId)) next.delete(checkId);
    else next.add(checkId);
    onSelectedChecksChange(next);
  };

  return (
    <div>
      <ContentText className="text-sm font-medium text-ink">
        {messages.awardEvidenceLabel}{" "}
        <span className="font-normal text-muted">— {messages.awardEvidenceHint}</span>
      </ContentText>
      <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
        {(evidence ?? []).map((row) => (
          <li key={row.checkId}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
              <Checkbox
                checked={selectedChecks.has(row.checkId)}
                disabled={disabled || loading}
                onCheckedChange={() => toggleCheck(row.checkId)}
              />
              <ContentText className="text-sm">{row.label}</ContentText>
            </label>
          </li>
        ))}
      </ul>
      <ContentText className={cn("mt-1.5 text-sm", evidenceOk ? "text-ok" : "text-ink-2")}>
        {fillMessage(messages.awardEvidenceCountTemplate, {
          selected: selectedCount,
          need: evidenceNeed,
        })}
      </ContentText>
    </div>
  );
};
