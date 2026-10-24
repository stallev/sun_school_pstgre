"use client";

import { useState } from "react";
import { AwardIcon, FlagIcon } from "lucide-react";
import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import { CancelPenaltyDialog } from "@/components/achievements/CancelPenaltyDialog.client";
import { IssuePenaltyDialog } from "@/components/achievements/IssuePenaltyDialog.client";
import { ManualAwardDialog } from "@/components/achievements/ManualAwardDialog.client";
import { RevokeAwardDialog } from "@/components/achievements/RevokeAwardDialog.client";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PupilAwardRow, PupilPenaltyRow } from "@/lib/achievements/pupil-achievement-panel-types";
import { formatTierLabel } from "@/lib/achievements/format-tier-label";
import type { ManualAwardFormData } from "@/lib/achievements/manual-award-types";
import type { PupilPenaltyFormData } from "@/lib/achievements/pupil-penalty-form-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type PupilAchievementPanelContentProps = {
  pupilId: string;
  pupilName: string;
  gradeId: string;
  academicYearId: string;
  canMutate: boolean;
  awards: PupilAwardRow[];
  penalties: PupilPenaltyRow[];
  manualAwardForm: ManualAwardFormData;
  penaltyForm: PupilPenaltyFormData;
  messages: TeacherAchievementsMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const PupilAchievementPanelContent = ({
  pupilId,
  pupilName,
  gradeId,
  academicYearId,
  canMutate,
  awards,
  penalties,
  manualAwardForm,
  penaltyForm,
  messages,
  dictionaries,
  formError,
}: PupilAchievementPanelContentProps) => {
  const [awardOpen, setAwardOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [revokeAward, setRevokeAward] = useState<PupilAwardRow | null>(null);
  const [cancelPenalty, setCancelPenalty] = useState<PupilPenaltyRow | null>(null);

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>{messages.penaltiesSectionTitle}</SectionTitle>
            <ContentText className="mt-1 max-w-[62ch] text-sm text-ink-2">
              {messages.penaltiesSectionDescription}
            </ContentText>
          </div>
          {canMutate ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setPenaltyOpen(true)}>
              <FlagIcon className="size-4 text-penalty" aria-hidden />
              {messages.issuePenaltyButton}
            </Button>
          ) : null}
        </div>
        <div className="mt-1">
          {penalties.length === 0 ? (
            <ContentText className="text-sm text-muted">{messages.penaltiesEmpty}</ContentText>
          ) : (
            <ul className="divide-y divide-line">
              {penalties.map((row) => (
                <li key={row.penaltyId} className="flex flex-wrap items-center gap-2 py-2.5">
                  <FlagIcon className="size-4 shrink-0 text-penalty" aria-hidden />
                  <ContentText className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-penalty">{messages.penaltyWord}</span>
                    {`: ${row.name} · ${row.points}`}
                  </ContentText>
                  {row.canCancel ? (
                    <Button type="button" size="compact" variant="ghost" onClick={() => setCancelPenalty(row)}>
                      {messages.cancelPenaltyButton}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle>{messages.awardsSectionTitle}</SectionTitle>
            <ContentText className="mt-1 max-w-[62ch] text-sm text-ink-2">
              {messages.awardsSectionDescription}
            </ContentText>
          </div>
          {canMutate ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setAwardOpen(true)}>
              <AwardIcon className="size-4" aria-hidden />
              {messages.manualAwardButton}
            </Button>
          ) : null}
        </div>
        <div className="mt-1">
          {awards.length === 0 ? (
            <ContentText className="text-sm text-muted">{messages.awardsEmpty}</ContentText>
          ) : (
            <ul className="divide-y divide-line">
              {awards.map((row) => (
                <li key={row.awardId} className="flex gap-3 py-2.5">
                  <AchievementTierDot tierIndex={row.tier - 1} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <ContentText className="font-medium">
                      {row.name}{" "}
                      <span className="font-normal text-muted">
                        · {formatTierLabel(row.tier, messages)}
                        {row.isManual ? ` · ${messages.manualTag}` : ""}
                      </span>
                    </ContentText>
                    {row.evidenceLabels.length > 0 ? (
                      <ContentText className="text-sm text-ink-2">{row.evidenceLabels.join(", ")}</ContentText>
                    ) : null}
                    <ContentText className="text-sm text-ink-2">
                      {row.isRevoked ? messages.awardPointsRevoked : `+${row.points}`}
                    </ContentText>
                  </div>
                  {row.canRevoke ? (
                    <Button type="button" size="compact" variant="ghost" onClick={() => setRevokeAward(row)}>
                      {messages.revokeButton}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      {awardOpen ? (
        <ManualAwardDialog
          open
          onOpenChange={setAwardOpen}
          gradeId={gradeId}
          academicYearId={academicYearId}
          formData={manualAwardForm}
          fixedPupilId={pupilId}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
      {penaltyOpen ? (
        <IssuePenaltyDialog
          open
          onOpenChange={setPenaltyOpen}
          pupilId={pupilId}
          pupilName={pupilName}
          formData={penaltyForm}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
      {revokeAward ? (
        <RevokeAwardDialog
          open
          onOpenChange={(open) => {
            if (!open) setRevokeAward(null);
          }}
          awardId={revokeAward.awardId}
          pupilName={pupilName}
          achievementName={revokeAward.name}
          tier={revokeAward.tier}
          points={revokeAward.points}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
      {cancelPenalty ? (
        <CancelPenaltyDialog
          open
          onOpenChange={(open) => {
            if (!open) setCancelPenalty(null);
          }}
          penaltyId={cancelPenalty.penaltyId}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
    </div>
  );
};
