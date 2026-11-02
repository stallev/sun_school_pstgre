import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PupilSuggestionRow } from "@/lib/achievements/pupil-achievement-panel-types";
import { fillMessage } from "@/lib/messages/fill-message";
import type { TeacherSuggestionMessages } from "@/lib/messages/teacher-suggestion-messages";

type PupilSuggestionListProps = {
  suggestions: PupilSuggestionRow[];
  messages: TeacherSuggestionMessages;
  formatTier: (tier: number) => string;
  onOpen: (suggestion: PupilSuggestionRow) => void;
};

/** "Awaiting confirmation" block of the pupil panel (screens spec 5.8). Hidden when empty. */
export const PupilSuggestionList = ({
  suggestions,
  messages,
  formatTier,
  onOpen,
}: PupilSuggestionListProps) => {
  if (suggestions.length === 0) return null;
  return (
    <Card className="p-3">
      <SectionTitle>{messages.title}</SectionTitle>
      <ul className="mt-1 divide-y divide-line">
        {suggestions.map((row) => (
          <li key={row.suggestionId} className="flex flex-wrap items-center gap-3 py-2.5">
            <AchievementTierDot tierIndex={row.tier - 1} />
            <ContentText className="min-w-0 flex-1 font-medium">
              {row.achievementName}{" "}
              <span className="font-normal text-muted">
                · {formatTier(row.tier)}
                {row.deferredDateLabel
                  ? ` · ${fillMessage(messages.deferredTemplate, { date: row.deferredDateLabel })}`
                  : ""}
              </span>
            </ContentText>
            {row.canAct ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpen(row)}>
                {messages.confirmButton}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
};
