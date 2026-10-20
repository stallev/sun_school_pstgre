import {
  shouldDiscloseDeletedChildCount,
  shouldShowDeletedDataNote,
} from "@sunschool/domain";
import { Banner } from "@/components/patterns/Banner";
import { fillMessage } from "@/lib/messages/fill-message";
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
    ? fillMessage(messages.deletedData.noteWithCount, {
        date: latestResolvedDateLabel,
        count: deletedChildCount,
      })
    : fillMessage(messages.deletedData.note, { date: latestResolvedDateLabel });

  return (
    <Banner tone="info" title={messages.deletedData.title}>
      {body}
    </Banner>
  );
};
