import { ContentText } from "@/components/atoms/ContentText";
import { fillMessage } from "@/lib/messages/fill-message";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";

type BricksEarnedBonusLineProps = {
  bonus: number;
  penalties: number;
  messages: TeacherAchievementsMessages;
};

export const BricksEarnedBonusLine = ({
  bonus,
  penalties,
  messages,
}: BricksEarnedBonusLineProps) => {
  if (bonus <= 0 && penalties <= 0) return null;
  if (bonus > 0 && penalties > 0) {
    const bonusText = fillMessage(messages.bricksIncludingBonusTemplate, { bonus });
    const penaltyText = fillMessage(messages.bricksIncludingPenaltiesTemplate, { penalties });
    return (
      <ContentText className="mt-1 text-sm text-muted">
        {bonusText}
        {", "}
        <span className="text-penalty">{penaltyText}</span>
      </ContentText>
    );
  }
  if (bonus > 0) {
    return (
      <ContentText className="mt-1 text-sm text-muted">
        {fillMessage(messages.bricksIncludingBonusTemplate, { bonus })}
      </ContentText>
    );
  }
  return (
    <ContentText className="mt-1 text-sm text-penalty">
      {fillMessage(messages.bricksIncludingPenaltiesTemplate, { penalties })}
    </ContentText>
  );
};
