import { AchievementTierDot } from "@/components/achievements/AchievementTierDot";
import { SuggestionVerseList } from "@/components/achievements/SuggestionVerseList";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
import type { ParentSuggestionView } from "@/data/families/load-parent-pending-suggestions.server";
import { fillMessage } from "@/lib/messages/fill-message";
import type { ParentMessages } from "@/lib/messages/parent-messages";

type ParentSuggestionCardProps = {
  suggestion: ParentSuggestionView;
  messages: ParentMessages;
};

/** Read-only card "waiting for the teacher to confirm": no actions, no points. */
export const ParentSuggestionCard = ({ suggestion, messages }: ParentSuggestionCardProps) => {
  const text = messages.child.suggestion;
  return (
    <Card className="p-4">
      <ContentText className="text-sm font-bold text-ink-2">{text.caption}</ContentText>
      <div className="mt-1 flex items-center gap-2">
        <AchievementTierDot tierIndex={suggestion.tier - 1} />
        <SectionTitle as="h3">
          {suggestion.achievementName} · {fillMessage(text.tier, { tier: suggestion.tier })}
        </SectionTitle>
      </div>
      <ContentText className="mt-1 text-sm text-ink-2">{text.hint}</ContentText>
      <ContentText className="mt-3 text-sm font-bold">{text.versesTitle}</ContentText>
      <SuggestionVerseList
        verses={suggestion.verses}
        emptyLabel={text.versesEmpty}
        textMissingLabel={text.textMissing}
        className="mt-1"
      />
    </Card>
  );
};
