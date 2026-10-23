import { FlagIcon } from "lucide-react";
import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
import type { PupilAchievementPanelData } from "@/data/achievements/load-pupil-achievement-panel.server";
import type { ParentMessages } from "@/lib/messages/parent-messages";

type ParentAchievementsReadOnlyProps = {
  panel: PupilAchievementPanelData;
  achievementsEnabled: boolean;
  messages: ParentMessages;
};

export const ParentAchievementsReadOnly = ({
  panel,
  achievementsEnabled,
  messages,
}: ParentAchievementsReadOnlyProps) => {
  if (!achievementsEnabled) return null;
  if (panel.kind === "hidden") return null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionTitle as="h2">{messages.child.achievementsTitle}</SectionTitle>
        {!panel.modeOn ? (
          <ContentText className="mt-2 text-sm text-ink-2">{messages.child.achievementsOff}</ContentText>
        ) : panel.awards.length === 0 ? (
          <ContentText className="mt-2 text-sm text-muted">—</ContentText>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {panel.awards.map((row) => (
              <li key={row.awardId} className="flex items-center gap-2 py-2">
                <AchievementTierDot tierIndex={row.tier - 1} />
                <ContentText className="text-sm">
                  {row.name} · {row.tier} · +{row.points}
                </ContentText>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {panel.modeOn ? (
        <Card className="p-4">
          <SectionTitle as="h2">{messages.child.penaltiesTitle}</SectionTitle>
          <ContentText className="mt-1 text-sm text-ink-2">{messages.child.penaltiesHint}</ContentText>
          {panel.penalties.length === 0 ? (
            <ContentText className="mt-2 text-sm text-muted">—</ContentText>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {panel.penalties.map((row) => (
                <li key={row.penaltyId} className="flex items-center gap-2 py-2">
                  <FlagIcon className="size-4 text-penalty" aria-hidden />
                  <ContentText className="text-sm">
                    {row.name} · {row.points}
                  </ContentText>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
};
