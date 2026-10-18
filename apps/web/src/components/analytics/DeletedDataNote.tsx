import {
  shouldDiscloseDeletedChildCount,
  shouldShowDeletedDataNote,
} from "@sunschool/domain";
import { Banner } from "@/components/patterns/Banner";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type DeletedDataNoteProps = {
  deletedChildCount: number;
  latestResolvedDateLabel: string;
  messages: AnalyticsMessages;
};

export const DeletedDataNote = ({
  deletedChildCount,
  latestResolvedDateLabel,
  messages,
}: DeletedDataNoteProps) => {
  if (!shouldShowDeletedDataNote(deletedChildCount)) return null;

  const body = shouldDiscloseDeletedChildCount(deletedChildCount)
    ? messages.deletedData.noteWithCount(latestResolvedDateLabel, deletedChildCount)
    : messages.deletedData.note(latestResolvedDateLabel);

  return (
    <Banner tone="info" title={messages.deletedData.title}>
      {body}
    </Banner>
  );
};
